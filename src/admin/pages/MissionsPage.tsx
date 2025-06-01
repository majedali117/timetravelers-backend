import React, { useState, useEffect } from 'react';
import { missionAPI } from '../services/api';
import { Pencil, Trash2, Search, Plus, Filter } from 'lucide-react';

interface Mission {
  _id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  careerField: string;
  estimatedTime: number;
  rewards: {
    points: number;
    badges: string[];
  };
  createdAt: string;
  isActive: boolean;
}

const MissionsPage: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    difficulty: '',
    careerField: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMissions();
  }, [currentPage, filters]);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, these filters would be passed to the API
      const response = await missionAPI.getAllMissions(currentPage, 10);
      setMissions(response.data);
      setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit));
    } catch (err: any) {
      console.error('Error fetching missions:', err);
      setError(err.message || 'Failed to fetch missions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMissions();
  };

  const handleEditMission = (mission: Mission) => {
    setSelectedMission(mission);
    setIsModalOpen(true);
  };

  const handleDeleteMission = async (missionId: string) => {
    if (window.confirm('Are you sure you want to delete this mission?')) {
      try {
        await missionAPI.deleteMission(missionId);
        fetchMissions();
      } catch (err: any) {
        console.error('Error deleting mission:', err);
        setError(err.message || 'Failed to delete mission');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-orange-100 text-orange-800';
      case 'expert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Missions</h1>
          <p className="text-gray-400 mt-1">Manage career guidance missions</p>
        </div>
        <button 
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center"
          onClick={() => {
            setSelectedMission(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Mission
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
                placeholder="Search missions..."
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-700 rounded-md">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Type
              </label>
              <select
                className="bg-gray-600 text-white w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
              >
                <option value="">All Types</option>
                <option value="learning">Learning</option>
                <option value="challenge">Challenge</option>
                <option value="project">Project</option>
                <option value="assessment">Assessment</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Difficulty
              </label>
              <select
                className="bg-gray-600 text-white w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={filters.difficulty}
                onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
              >
                <option value="">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
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

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Difficulty
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Career Field
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Points
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="h-4 bg-gray-700 rounded w-16 animate-pulse ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : missions.length > 0 ? (
                missions.map((mission) => (
                  <tr key={mission._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{mission.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {mission.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getDifficultyColor(mission.difficulty)}`}>
                        {mission.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{mission.careerField}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{formatTime(mission.estimatedTime)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{mission.rewards.points}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        mission.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {mission.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditMission(mission)}
                        className="text-purple-400 hover:text-purple-300 mr-3"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMission(mission._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-400">
                    No missions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

      {/* Mission Modal - In a real implementation, this would be a separate component */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedMission ? 'Edit Mission' : 'Add New Mission'}
            </h2>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className="bg-gray-700 text-white w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  defaultValue={selectedMission?.title || ''}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="bg-gray-700 text-white w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  defaultValue={selectedMission?.description || ''}
                ></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Type
                  </label>
                  <select
                    className="bg-gray-700 text-white w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    defaultValue={selectedMission?.type || 'learning'}
                  >
                    <option value="learning">Learning</option>
                    <option value="challenge">Challenge</option>
                    <option value="project">Project</option>
                    <option value="assessment">Assessment</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Difficulty
                  </label>
                  <select
                    className="bg-gray-700 text-white w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    defaultValue={selectedMission?.difficulty || 'beginner'}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Career Field
                  </label>
                  <select
                    className="bg-gray-700 text-white w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    defaultValue={selectedMission?.careerField || 'technology'}
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
                    Estimated Time (minutes)
                  </label>
                  <input
                    type="number"
                    className="bg-gray-700 text-white w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    defaultValue={selectedMission?.estimatedTime || 30}
                    min={1}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Points
                  </label>
                  <input
                    type="number"
                    className="bg-gray-700 text-white w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    defaultValue={selectedMission?.rewards?.points || 100}
                    min={0}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Status
                  </label>
                  <select
                    className="bg-gray-700 text-white w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    defaultValue={selectedMission?.isActive ? 'active' : 'inactive'}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
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
                  {selectedMission ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionsPage;
