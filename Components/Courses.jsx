import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Modal,
  TextField,
  InputAdornment,
  Pagination,
  Card,
  CardContent,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  Book as BookIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCourse, setCurrentCourse] = useState({
    name: '',
    courseFee: '',
    subjects: [],
    id: null
  });
  const [openSubjectModal, setOpenSubjectModal] = useState(false);
  const [currentSubject, setCurrentSubject] = useState({
    subjectName: '',
    subjectID: '',
    originalID: '',
    originalName: '',
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [teachers, setTeachers] = useState([]);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesResponse, teachersResponse] = await Promise.all([
          axios.get('/api/courses'),
          axios.get('/api/teachers')
        ]);
        setCourses(coursesResponse.data);
        setTeachers(teachersResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbarMessage('Error fetching data');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };

    fetchData();
  }, []);

  const getTeacherCount = (courseName) => {
    return teachers.filter(teacher => 
      teacher.status === 'Active' && 
      Array.isArray(teacher.courses) && 
      teacher.courses.includes(courseName)
    ).length;
  };

  const handleCourseClick = async (course) => {
    try {
      const response = await axios.get(`/api/courses/${course.id}`);
      setSelectedCourse(response.data);
    } catch (error) {
      console.error('Error fetching course details:', error);
      setSnackbarMessage('Error fetching course details');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleOpenModal = (course = null) => {
    if (course) {
      setCurrentCourse(course);
      setEditMode(true);
    } else {
      setCurrentCourse({
        name: '',
        courseFee: '',
        subjects: [],
        id: null
      });
      setEditMode(false);
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setCurrentCourse({
      name: '',
      courseFee: '',
      subjects: []
    });
    setEditMode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(`/api/courses/${currentCourse.id}`, currentCourse);
        const response = await axios.get('/api/courses');
        setCourses(response.data);
        setSnackbarMessage('Course updated successfully!');
      } else {
        const newCourse = {
          ...currentCourse,
          id: uuidv4(),
          subjects: []
        };
        
        const response = await axios.post('/api/courses', newCourse);
        setCourses(prev => [...prev, response.data]);
        setSnackbarMessage('Course added successfully!');
      }
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseModal();
    } catch (error) {
      console.error('Error saving course:', error);
      setSnackbarMessage('Error saving course');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async (courseID) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this course?');
    if (confirmDelete) {
      try {
        await axios.delete(`/api/courses/${courseID}`);
        
        if (selectedCourse && selectedCourse.id === courseID) {
          setSelectedCourse(null);
        }
        
        const response = await axios.get('/api/courses');
        setCourses(response.data);
        
        setSnackbarMessage('Course deleted successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        setSnackbarMessage('Error deleting course');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleEditSubject = (subject) => {
    setCurrentSubject({
      subjectID: subject.subjectID,
      subjectName: subject.subjectName,
      originalID: subject.subjectID    // Keep track of original ID for updating
    });
    setOpenSubjectModal(true);
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // For editing existing subject
      if (currentSubject.originalID) {
        // First, check if the new subject ID already exists (except for the current subject)
        const subjectExists = selectedCourse.subjects.some(
          subject => subject.subjectID === currentSubject.subjectID && 
                    subject.subjectID !== currentSubject.originalID
        );

        if (subjectExists) {
          setSnackbarMessage('Subject ID already exists!');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          return;
        }

        // Update the subjects array
        const updatedSubjects = selectedCourse.subjects.map(subject => 
          subject.subjectID === currentSubject.originalID 
            ? {
                subjectID: currentSubject.subjectID,
                subjectName: currentSubject.subjectName
              }
            : subject
        );

        // Create updated course object
        const updatedCourse = {
          ...selectedCourse,
          subjects: updatedSubjects
        };

        // Update in database
        await axios.put(`/api/courses/${selectedCourse.id}`, updatedCourse);

        // Also update any existing grades with the new subject ID
        const gradesResponse = await axios.get('/api/grades');
        const gradesToUpdate = gradesResponse.data.filter(
          grade => grade.subjectID === currentSubject.originalID
        );

        // Update grades with new subject ID if necessary
        if (gradesToUpdate.length > 0) {
          const gradeUpdatePromises = gradesToUpdate.map(grade =>
            axios.put(`/api/grades/${grade.id}`, {
              ...grade,
              subjectID: currentSubject.subjectID
            })
          );
          await Promise.all(gradeUpdatePromises);
        }

        // Update local state
        setSelectedCourse(updatedCourse);
        
        // Refresh courses
        const coursesResponse = await axios.get('/api/courses');
        setCourses(coursesResponse.data);

        setSnackbarMessage('Subject updated successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setOpenSubjectModal(false);
      } else {
        // Adding new subject
        const subjectExists = selectedCourse.subjects.some(
          subject => subject.subjectID === currentSubject.subjectID
        );

        if (subjectExists) {
          setSnackbarMessage('Subject ID already exists!');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          return;
        }

        // Update course with new subject
        const updatedCourse = {
          ...selectedCourse,
          subjects: [...selectedCourse.subjects, {
            subjectID: currentSubject.subjectID,
            subjectName: currentSubject.subjectName
          }]
        };

        // Update course in database
        await axios.put(`/api/courses/${selectedCourse.id}`, updatedCourse);

        // Get all active students in this course
        const studentsResponse = await axios.get('/api/students');
        const activeStudents = studentsResponse.data.filter(
          student => student.course === selectedCourse.name && student.status === 'Active'
        );

        // Create grade entries for all active students
        if (activeStudents.length > 0) {
          const gradePromises = activeStudents.map(student => {
            return axios.post('/api/grades', {
              id: uuidv4(), 
              ID: student.id,
              subjectID: currentSubject.subjectID,
              homework: '',
              assignment: '',
              groupDiscussion: '',
              project: '',
              totalScore: '',
              grade: ''
            });
          });

          await Promise.all(gradePromises);
        }

        // Update local state
        setSelectedCourse(updatedCourse);
        
        // Refresh courses list
        const response = await axios.get('/api/courses');
        setCourses(response.data);

        setSnackbarMessage('Subject added successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setOpenSubjectModal(false);
      }
    } catch (error) {
      console.error('Error saving subject:', error);
      setSnackbarMessage('Error saving subject: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteSubject = async (subjectID) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this subject?');
    if (confirmDelete) {
      try {
        const updatedSubjects = selectedCourse.subjects.filter(
          (subject) => subject.subjectID !== subjectID
        );
        const updatedCourse = {
          ...selectedCourse,
          subjects: updatedSubjects
        };
        
        await axios.put(`/api/courses/${selectedCourse.id}`, updatedCourse);
        
        // Update the selected course state immediately
        setSelectedCourse(updatedCourse);
        
        // Fetch updated courses and update the courses list
        const response = await axios.get('/api/courses');
        setCourses(response.data);
        
        setSnackbarMessage('Subject deleted successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        setSnackbarMessage('Error deleting subject');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const compareValues = (a, b, property) => {
    if (property === 'courseFee') {
      return order === 'asc' ? 
        Number(a[property] || 0) - Number(b[property] || 0) : 
        Number(b[property] || 0) - Number(a[property] || 0);
    }
    
    if (property === 'subjects') {
      return order === 'asc' ? 
        a[property].length - b[property].length : 
        b[property].length - a[property].length;
    }
    
    const valueA = (a[property] || '').toString().toLowerCase();
    const valueB = (b[property] || '').toString().toLowerCase();
    
    return order === 'asc' ? 
      valueA.localeCompare(valueB) : 
      valueB.localeCompare(valueA);
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setSnackbarMessage('Error fetching courses');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Add this new function to handle subject modal closing
  const handleCloseSubjectModal = () => {
    setOpenSubjectModal(false);
    setCurrentSubject({
      subjectName: '',
      subjectID: '',
      originalID: '',
      originalName: '',
    });
  };

  // Add this function to filter subjects based on search query
  const filteredSubjects = selectedCourse?.subjects.filter(subject => {
    const searchLower = searchQuery.toLowerCase();
    return (
      subject.subjectName.toLowerCase().includes(searchLower) ||
      subject.subjectID.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Course List Section */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
          sx={{ height: '45px' }}
        >
          Add Course
        </Button>
      </Box>

      {/* Course List */}
      <TableContainer component={Paper} sx={{ mb: 5 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell 
                onClick={() => handleSort('name')}
                sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
              >
                Course Name {orderBy === 'name' && (order === 'asc' ? '▲' : '▼')}
              </TableCell>
              <TableCell 
                onClick={() => handleSort('courseFee')}
                sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
              >
                Course Fee {orderBy === 'courseFee' && (order === 'asc' ? '▲' : '▼')}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...courses]
              .sort((a, b) => compareValues(a, b, orderBy))
              .map((course) => (
                <TableRow 
                  key={course.id}
                  onClick={() => handleCourseClick(course)}
                  sx={{
                    transition: 'box-shadow 0.2s',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#f8fdff',
                      boxShadow: '0 10px 10px -4px rgba(0,0,0,0.2), 0 -8px 8px -4px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  <TableCell>
                    <Typography>{course.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography>RM {course.courseFee}</Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal(course);
                    }}
                    sx={{ color: '#4CAF50' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(course.id);
                    }}
                    sx={{ color: '#F44336' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ borderBottom: '2px solid #e0e0e0', mb: 4, mt: 2 }} />

      {/* Course Details Section */}
      {selectedCourse && (
        <>
          <Typography variant="h5" sx={{ mb: 3 }}>
            {selectedCourse.name} Details
          </Typography>

          {/* Info Cards */}
          <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
            {/* Teachers Card */}
            <Paper sx={{ 
              flex: 1, 
              backgroundColor: '#FFF4DE',
              borderRadius: '16px',
              position: 'relative',
              height: '120px',
              p: 4
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                pt: 1,
                pb: 2
              }}>
                <PeopleIcon sx={{ fontSize: 40, color: '#FFB11C' }} />
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#FFB11C'
                  }}
                >
                  {getTeacherCount(selectedCourse.name)}
                </Typography>
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  position: 'absolute',
                  bottom: '2rem',
                  left: '2rem',
                  fontWeight: 700,
                  color: '#FFB11C'
                }}
              >
                TEACHERS
              </Typography>
            </Paper>

            {/* Subjects Card */}
            <Paper sx={{ 
              flex: 1, 
              backgroundColor: '#E1F0FF',
              borderRadius: '16px',
              position: 'relative',
              height: '120px',
              p: 4
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                pt: 1,
                pb: 2
              }}>
                <BookIcon sx={{ fontSize: 40, color: '#3699FF' }} />
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#3699FF'
                  }}
                >
                  {selectedCourse.subjects.length}
                </Typography>
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  position: 'absolute',
                  bottom: '2rem',
                  left: '2rem',
                  fontWeight: 700,
                  color: '#3699FF'
                }}
              >
                SUBJECTS
              </Typography>
            </Paper>

            {/* Course Fee Card */}
            <Paper sx={{ 
              flex: 1, 
              backgroundColor: '#FFE2E5',
              borderRadius: '16px',
              position: 'relative',
              height: '120px',
              p: 4
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                pt: 1,
                pb: 2
              }}>
                <MoneyIcon sx={{ fontSize: 40, color: '#F64E60' }} />
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#F64E60'
                  }}
                >
                  RM {selectedCourse.courseFee}
                </Typography>
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  position: 'absolute',
                  bottom: '2rem',
                  left: '2rem',
                  fontWeight: 700,
                  color: '#F64E60'
                }}
              >
                COURSE FEE
              </Typography>
            </Paper>
          </Box>

          {/* Subjects Section */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={() => setFilterOpen(!filterOpen)}>
                <FilterListIcon />
              </IconButton>
              {filterOpen && (
                <TextField
                  label="Search Subjects"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setCurrentSubject({ subjectName: '', subjectID: '' });
                setOpenSubjectModal(true);
              }}
              sx={{ height: '45px' }}
            >
              Add Subject
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell 
                    onClick={() => handleSort('subjectID')}
                    sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                  >
                    ID {orderBy === 'subjectID' && (order === 'asc' ? '▲' : '▼')}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('subjectName')}
                    sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                  >
                    Subject Name {orderBy === 'subjectName' && (order === 'asc' ? '▲' : '▼')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSubjects
                  .sort((a, b) => compareValues(a, b, orderBy))
                  .map((subject) => (
                    <TableRow 
                      key={subject.subjectID}
                      sx={{
                        transition: 'box-shadow 0.2s',
                        '&:hover': {
                          backgroundColor: '#fffaf9',
                          boxShadow: '0 10px 10px -4px rgba(0,0,0,0.2), 0 -8px 8px -4px rgba(0,0,0,0.2)',
                          cursor: 'pointer'
                        }
                      }}
                    >
                      <TableCell>
                        <Typography>{subject.subjectID}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{subject.subjectName}</Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSubject(subject);
                          }}
                          sx={{ color: '#4CAF50' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubject(subject.subjectID);
                          }}
                          sx={{ color: '#F44336' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1, pb: 2 }}>
            <Pagination
              count={Math.ceil(filteredSubjects.length / rowsPerPage)}
              page={page}
              onChange={(e, value) => setPage(value)}
            />
          </Box>
        </>
      )}

      {/* Course Modal */}
      <Modal 
        open={openModal} 
        onClose={handleCloseModal}
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}>
          <Typography variant="h5" sx={{ mb: 3 }}>
            {editMode ? 'Edit Course' : 'Add New Course'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Course Name"
              name="name"
              value={currentCourse.name}
              onChange={(e) => setCurrentCourse({ ...currentCourse, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Course Fee"
              name="courseFee"
              value={currentCourse.courseFee}
              onChange={(e) => setCurrentCourse({ ...currentCourse, courseFee: e.target.value })}
              required
              sx={{ mb: 3 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button 
                variant="contained" 
                color="inherit" 
                onClick={handleCloseModal}
                type="button"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
              >
                {editMode ? 'Update' : 'Create'}
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>

      {/* Subject Modal */}
      <Modal 
        open={openSubjectModal} 
        onClose={handleCloseSubjectModal}
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}>
          <Typography variant="h5" sx={{ mb: 3 }}>
            {currentSubject.subjectID ? 'Edit Subject' : 'Add New Subject'}
          </Typography>
          <form onSubmit={handleSubjectSubmit}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="Subject Name"
                value={currentSubject.subjectName}
                onChange={(e) => setCurrentSubject({ ...currentSubject, subjectName: e.target.value })}
                required
                sx={{ flex: 4 }}
              />
              <TextField
                label="ID"
                value={currentSubject.subjectID}
                onChange={(e) => setCurrentSubject({ ...currentSubject, subjectID: e.target.value })}
                required
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={handleCloseSubjectModal}>Cancel</Button>
              <Button type="submit" variant="contained">Add</Button>
            </Box>
          </form>
        </Box>
      </Modal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Courses;