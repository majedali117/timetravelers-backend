import React, { useState, useEffect } from 'react';
import { protocolAPI } from '../services/api';
import { Pencil, Trash2, Search, Plus, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface Protocol {
  _id: string;
  title: string;
  description: string;
  level: number;
  careerField: string;
  duration: {
    weeks: number;
    hoursPerWeek: number;
  };
  milestones: {
    title: string;
    description: string;
    order: number;
  }[];
  prerequisites: string[];
  isActive: boolean;
  createdAt: string;
}

const ProtocolsPage: React.FC = () => {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    level: '',
    careerField: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProtocols();
  }, [currentPage, filters]);

  const fetchProtocols = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, these filters would be passed to the API
      const response = await protocolAPI.getAllProtocols(currentPage, 10);
      setProtocols(response.data);
      setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit));
    } catch (err: any) {
      console.error('Error fetching protocols:', err);
      setError(err.message || 'Failed to fetch protocols');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProtocols();
  };

  const handleEditProtocol = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    setIsModalOpen(true);
  };

  const handleDeleteProtocol = async (protocolId: string) => {
    if (window.confirm('Are you sure you want to delete this protocol?')) {
      try {
        await protocolAPI.deleteProtocol(protocolId);
        fetchProtocols();
      } catch (err: any) {
        console.error('Error deleting protocol:', err);
        setError(err.message || 'Failed to delete protocol');
      }
    }
  };

  const toggleProtocolExpansion = (protocolId: string) => {
    if (expandedProtocol === protocolId) {
      setExpandedProtocol(null);
    } else {
      setExpandedProtocol(protocolId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Protocols</h1>
          <p className="text-gray-400 mt-1">Manage learning paths and protocols</p>
        </div>
        <button 
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center"
          onClick={() => {
            setSelectedProtocol(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Protocol
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search protocols..."
                className="bg-gray-700 text-white w-full pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
            >
              Search
            </button>
          </form>
          
          <button
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-5 w-5 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-700 rounded-md">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Level
              </label>
              <select
                className="bg-gray-600 text-white w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={filters.level}
                onChange={(e) => setFilters({...filters, level: e.target.value})}
              >
                <option value="">All Levels</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
                <option value="4">Level 4</option>
                <option value="5">Level 5</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Career Field
              </label>
              <select
                className="bg-gray-600 text-white w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={filters.careerField}
                onChange={(e) => setFilters({...filters, careerField: e.target.value})}
              >
                <option value="">All Fields</option>
                <option value="technology">Technology</option>
                <option value="business">Business</option>
                <option value="research">Research</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education</option>
              </select>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-700 rounded-lg p-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-600 rounded w-48"></div>
                    <div className="h-4 bg-gray-600 rounded w-32"></div>
                  </div>
                  <div className="h-8 w-8 bg-gray-600 rounded"></div>
                </div>
              </div>
            ))
          ) : protocols.length > 0 ? (
            protocols.map((protocol) => (
              <div key={protocol._id} className="bg-gray-700 rounded-lg overflow-hidden">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-650 flex justify-between items-center"
                  onClick={() => toggleProtocolExpansion(protocol._id)}
                >
                  <div>
                    <h3 className="text-lg font-medium text-white">{protocol.title}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-400">Level {protocol.level}</span>
                      <span className="text-sm text-gray-400">{protocol.careerField}</span>
                      <span className="text-sm text-gray-400">
                        {protocol.duration.weeks} weeks ({protocol.duration.hoursPerWeek} hrs/week)
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        protocol.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {protocol.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProtocol(protocol);
                      }}
                      className="text-purple-400 hover:text-purple-300 p-1"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProtocol(protocol._id);
                      }}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    {expandedProtocol === protocol._id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {expandedProtocol === protocol._id && (
                  <div className="p-4 border-t border-gray-600 bg-gray-750">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
                      <p className="text-sm text-gray-400">{protocol.description}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Milestones</h4>
                      <div className="space-y-2">
                        {protocol.milestones.map((milestone, index) => (
                          <div key={index} className="bg-gray-700 p-3 rounded-md">
                            <div className="flex items-center">
                              <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm mr-2">
                                {milestone.order}
                              </div>
                              <h5 className="font-medium">{milestone.title}</h5>
                            </div>
                            <p className="text-sm text-gray-400 mt-1 ml-8">{milestone.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {protocol.prerequisites.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Prerequisites</h4>
                        <ul className="list-disc list-inside text-sm text-gray-400">
                          {protocol.prerequisites.map((prerequisite, index) => (
                            <li key={index}>{prerequisite}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              No protocols found
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-700 text-white rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-700 text-white rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Protocol Modal - In a real implementation, this would be a separate component */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedProtocol ? 'Edit Protocol' : 'Add New Protocol'}
            </h2>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className="bg-gray-700 text-white w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  defaultValue={selectedProtocol?.title || ''}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="bg-gray-700 text-white w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  defaultValue={selectedProtocol?.description || ''}
                ></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Level
                  </label>
                  <select
                    className="bg-gray-700 text-white w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    defaultValue={selectedProtocol?.level || 1}
                  >
                    <option value={1}>Level 1</option>
                    <option value={2}>Level 2</option>
                    <option value={3}>Level 3</option>
                    <option value={4}>Level 4</option>
                    <option value={5}>Level 5</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Duration (weeks)
                  </label>
                  <input
                    type="number"
                    className="bg-gray-700 text-white w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    defaultValue={selectedProtocol?.duration?.weeks || 4}
                    min={1}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Hours per Week
                  </label>
                  <input
                    type="number"
                    className="bg-gray-700 text-white w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    defaultValue={selectedProtocol?.duration?.hoursPerWeek || 5}
                    min={1}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Career Field
                </label>
                <select
                  className="bg-gray-700 text-white w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  defaultValue={selectedProtocol?.careerField || 'technology'}
                >
                  <option value="technology">Technology</option>
                  <option value="business">Business</option>
                  <option value="research">Research</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Status
                </label>
                <select
                  className="bg-gray-700 text-white w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  defaultValue={selectedProtocol?.isActive ? 'active' : 'inactive'}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Milestones
                </label>
                <div className="space-y-3">
                  {(selectedProtocol?.milestones || [{ order: 1, title: '', description: '' }]).map((milestone, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded-md">
                      <div className="flex items-center mb-2">
                        <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm mr-2">
                          {milestone.order}
                        </div>
                        <input
                          type="text"
                          placeholder="Milestone title"
                          className="bg-gray-600 text-white flex-1 px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          defaultValue={milestone.title}
                        />
                      </div>
                      <textarea
                        placeholder="Milestone description"
                        rows={2}
                        className="bg-gray-600 text-white w-full px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        defaultValue={milestone.description}
                      ></textarea>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Prerequisites (comma separated)
                </label>
                <input
                  type="text"
                  className="bg-gray-700 text-white w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  defaultValue={selectedProtocol?.prerequisites?.join(', ') || ''}
                  placeholder="e.g. Basic programming knowledge, Understanding of algorithms"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                >
                  {selectedProtocol ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtocolsPage;
