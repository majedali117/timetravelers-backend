import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { mentorAPI } from '../services/api';
import { Loader2, Plus, Pencil, Trash2, Search, AlertCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import FileUploader from '../components/FileUploader';

interface Mentor {
  _id: string;
  name: string;
  title: string;
  specialization: string;
  bio: string;
  avatarUrl: string;
  experience: number;
  rating: number;
  status: 'active' | 'inactive';
}

const MentorsPage: React.FC = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [formData, setFormData] = useState<Partial<Mentor>>({
    name: '',
    title: '',
    specialization: '',
    bio: '',
    avatarUrl: '',
    experience: 0,
    rating: 5,
    status: 'active'
  });
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchMentors = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mentorAPI.getAllMentors(page, 10);
      setMentors(response.data);
      setTotalPages(Math.ceil(response.total / 10));
      setCurrentPage(page);
    } catch (err: any) {
      setError('Failed to fetch mentors. Please try again.');
      console.error('Error fetching mentors:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to fetch mentors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const handleSearch = () => {
    // In a real implementation, this would call an API with search parameters
    fetchMentors(1);
  };

  const handlePageChange = (page: number) => {
    fetchMentors(page);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseInt(value, 10)
    });
  };

  const handleFileUpload = (fileUrl: string) => {
    setFormData({
      ...formData,
      avatarUrl: fileUrl
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      specialization: '',
      bio: '',
      avatarUrl: '',
      experience: 0,
      rating: 5,
      status: 'active'
    });
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setFormData({
      name: mentor.name,
      title: mentor.title,
      specialization: mentor.specialization,
      bio: mentor.bio,
      avatarUrl: mentor.avatarUrl,
      experience: mentor.experience,
      rating: mentor.rating,
      status: mentor.status
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setIsDeleteDialogOpen(true);
  };

  const validateForm = () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Mentor name is required",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.title?.trim()) {
      toast({
        title: "Validation Error",
        description: "Mentor title is required",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.specialization?.trim()) {
      toast({
        title: "Validation Error",
        description: "Specialization is required",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleAddMentor = async () => {
    if (!validateForm()) return;
    
    setFormSubmitting(true);
    try {
      await mentorAPI.createMentor(formData);
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Mentor added successfully",
      });
      fetchMentors(currentPage);
    } catch (err: any) {
      console.error('Error adding mentor:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to add mentor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateMentor = async () => {
    if (!selectedMentor || !validateForm()) return;
    
    setFormSubmitting(true);
    try {
      await mentorAPI.updateMentor(selectedMentor._id, formData);
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Mentor updated successfully",
      });
      fetchMentors(currentPage);
    } catch (err: any) {
      console.error('Error updating mentor:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update mentor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteMentor = async () => {
    if (!selectedMentor) return;
    
    setFormSubmitting(true);
    try {
      await mentorAPI.deleteMentor(selectedMentor._id);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Success",
        description: "Mentor deleted successfully",
      });
      fetchMentors(currentPage);
    } catch (err: any) {
      console.error('Error deleting mentor:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete mentor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Mentors Management</CardTitle>
          <CardDescription>
            Manage AI mentors for the TimeTravelers platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex w-full md:w-auto gap-2">
              <Input
                placeholder="Search mentors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-80"
              />
              <Button onClick={handleSearch} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Mentor
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading mentors...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-500 p-4 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
              <Button 
                variant="outline" 
                className="ml-4" 
                onClick={() => fetchMentors(currentPage)}
              >
                Retry
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead className="hidden md:table-cell">Experience</TableHead>
                      <TableHead className="hidden md:table-cell">Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mentors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No mentors found
                        </TableCell>
                      </TableRow>
                    ) : (
                      mentors.map((mentor) => (
                        <TableRow key={mentor._id}>
                          <TableCell className="font-medium">{mentor.name}</TableCell>
                          <TableCell>{mentor.title}</TableCell>
                          <TableCell>{mentor.specialization}</TableCell>
                          <TableCell className="hidden md:table-cell">{mentor.experience} years</TableCell>
                          <TableCell className="hidden md:table-cell">{mentor.rating}/5</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              mentor.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {mentor.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openEditDialog(mentor)}
                              className="mr-1"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openDeleteDialog(mentor)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Mentor Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Mentor</DialogTitle>
            <DialogDescription>
              Create a new AI mentor for the TimeTravelers platform
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter mentor name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter mentor title"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization *</Label>
              <Input
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                placeholder="Enter mentor specialization"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Enter mentor bio"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <FileUploader
                endpoint="/api/v1/upload/avatar"
                onUploadComplete={handleFileUpload}
                acceptedFileTypes="image/*"
                maxSizeMB={2}
                label="Avatar Image"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Experience (years)</Label>
                <Input
                  id="experience"
                  name="experience"
                  type="number"
                  value={formData.experience}
                  onChange={handleNumberChange}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating</Label>
                <Input
                  id="rating"
                  name="rating"
                  type="number"
                  value={formData.rating}
                  onChange={handleNumberChange}
                  min={1}
                  max={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMentor} disabled={formSubmitting}>
              {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Mentor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Mentor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Mentor</DialogTitle>
            <DialogDescription>
              Update mentor information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter mentor name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter mentor title"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-specialization">Specialization *</Label>
              <Input
                id="edit-specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                placeholder="Enter mentor specialization"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Enter mentor bio"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <FileUploader
                endpoint="/api/v1/upload/avatar"
                onUploadComplete={handleFileUpload}
                acceptedFileTypes="image/*"
                maxSizeMB={2}
                label="Avatar Image"
                initialFileUrl={formData.avatarUrl}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-experience">Experience (years)</Label>
                <Input
                  id="edit-experience"
                  name="experience"
                  type="number"
                  value={formData.experience}
                  onChange={handleNumberChange}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-rating">Rating</Label>
                <Input
                  id="edit-rating"
                  name="rating"
                  type="number"
                  value={formData.rating}
                  onChange={handleNumberChange}
                  min={1}
                  max={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMentor} disabled={formSubmitting}>
              {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Mentor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Mentor Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the mentor "{selectedMentor?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteMentor}
              disabled={formSubmitting}
            >
              {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorsPage;
