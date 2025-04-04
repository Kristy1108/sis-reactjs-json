import React, { useState, useEffect } from 'react';
import {Box,Typography,Paper,IconButton,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,Button,
  Modal,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import InputAdornment from '@mui/material/InputAdornment';
import axios from 'axios';
import './Students.css'; // Add a CSS file for custom styles
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { v4 as uuidv4 } from 'uuid';

// Create a custom theme
const theme = createTheme({
  components: {
    MuiModal: {
      defaultProps: {
        disableBackdrop: true, // This will remove the blur effect
      },
    },
  },
});

const Students = () => {
  const [students, setStudents] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStudent, setCurrentStudent] = useState({
    id: null,
    name: '',
    nricPassport: '',
    gender: '',
    dob: '',
    age: '',
    country: '',
    phoneNumber: '',
    intake: '',
    course: '',
    status: 'Active',
    address: '',
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [availableCourses, setAvailableCourses] = useState([]);

  const countries = [
    { code: '+60', name: 'Malaysia' },
    { code: '+65', name: 'Singapore' },
  ];

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students');
      console.log('Fetched students:', response.data); // Debug log
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      setSnackbarMessage('Error fetching students');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const response = await axios.get('/api/courses');
      setAvailableCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleOpenModal = (student = null) => {
    fetchAvailableCourses();
    if (student) {
      setCurrentStudent({
        ...student,
        phoneNumber: student.phoneNumber
      });
      setEditMode(true);
    } else {
      setCurrentStudent({
        id: null,
        name: '',
        nricPassport: '',
        gender: '',
        dob: '',
        age: '',
        country: '',
        phoneNumber: '',
        intake: '',
        course: '',
        status: 'Active',
        address: ''
      });
      setEditMode(false);
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentStudent((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'dob') {
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      setCurrentStudent((prev) => ({
        ...prev,
        age,
      }));
    }

    if (name === 'country') {
      const countryCode = countries.find((c) => c.name === value)?.code || '';
      setCurrentStudent((prev) => ({
        ...prev,
        phoneNumber: countryCode,
      }));
    }
  };

  const calculateDateLimits = () => {
    const today = new Date();
    
    // Max date: 16 years ago from today
    const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    
    // Min date: 50 years ago (reasonable student age limit)
    const minDate = new Date(today.getFullYear() - 50, today.getMonth(), today.getDate());
    
    return {
      max: maxDate.toISOString().split('T')[0],
      min: minDate.toISOString().split('T')[0]
    };
  };

  const validateNRIC = async (nric, currentId = null) => {
    try {
      // Get all teachers and students
      const [teachersRes, studentsRes] = await Promise.all([
        axios.get('/api/teachers'),
        axios.get('/api/students')
      ]);

      // Check if NRIC exists in teachers
      const teacherExists = teachersRes.data.some(teacher => 
        teacher.nricPassport === nric
      );

      // Check if NRIC exists in students (excluding current student if editing)
      const studentExists = studentsRes.data.some(student => 
        student.nricPassport === nric && student.id !== currentId
      );

      return !teacherExists && !studentExists;
    } catch (error) {
      console.error('Error validating NRIC:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate NRIC/Passport
    const isNRICValid = await validateNRIC(currentStudent.nricPassport, currentStudent.id);
    if (!isNRICValid) {
      setSnackbarMessage('NRIC/Passport already exists in the system');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const studentData = {
        ...currentStudent,
        id: currentStudent.id || Math.random().toString(36).substring(2, 6)
      };

      if (editMode) {
        await axios.put(`/api/students/${studentData.id}`, studentData);
      } else {
        // First, save the new student
        await axios.post('/api/students', studentData);
        
        // Then get the course details
        const coursesResponse = await axios.get('/api/courses');
        const studentCourse = coursesResponse.data.find(course => course.name === studentData.course);
        
        if (studentCourse && studentCourse.subjects) {
          // Create grade records for each subject in the course
          for (const subject of studentCourse.subjects) {
            await axios.post('/api/grades', {
              id: Math.random().toString(36).substring(2, 6),
              ID: studentData.id,
              subjectID: subject.subjectID,
              homework: "",
              assignment: "",
              groupDiscussion: "",
              project: "",
              totalScore: "",
              grade: ""
            });
          }
        } else {
          console.error('Course or subjects not found:', studentData.course);
        }
      }

      setSnackbarMessage(editMode ? 'Student updated successfully!' : 'Student added successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Refresh the students list
      await fetchStudents();
      handleCloseModal();
    } catch (error) {
      console.error('Error:', error);
      setSnackbarMessage('Failed to save student: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async (studentID) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this student?');
    if (confirmDelete) {
      try {
        await axios.delete(`/api/students/${studentID}`);
        setSnackbarMessage('Student deleted successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        fetchStudents();
      } catch (error) {
        console.error('Error:', error);
        setSnackbarMessage('Failed to delete student');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleStatusChange = async (studentID, status) => {
    try {
      await axios.patch(`/api/students/${studentID}`, { status });
      setSnackbarMessage('Student status updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchStudents();
    } catch (error) {
      console.error('Error:', error);
      setSnackbarMessage('Failed to update student status');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleFilter = () => {
    // Filter logic can be implemented here
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const compareValues = (a, b, property) => {
    // Handle numeric values
    if (['age'].includes(property)) {
      return order === 'asc' ? 
        Number(a[property] || 0) - Number(b[property] || 0) : 
        Number(b[property] || 0) - Number(a[property] || 0);
    }
    
    // Handle date values
    if (['dob'].includes(property)) {
      return order === 'asc' ? 
        new Date(a[property]) - new Date(b[property]) : 
        new Date(b[property]) - new Date(a[property]);
    }
    
    // Handle string values
    const valueA = (a[property] || '').toString().toLowerCase();
    const valueB = (b[property] || '').toString().toLowerCase();
    
    if (order === 'asc') {
      return valueA.localeCompare(valueB);
    }
    return valueB.localeCompare(valueA);
  };

  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.nricPassport?.toLowerCase().includes(searchLower) ||
      student.gender?.toLowerCase().includes(searchLower) ||
      student.dob?.includes(searchQuery) ||
      student.age?.toString().includes(searchQuery) ||
      student.country?.toLowerCase().includes(searchLower) ||
      student.phoneNumber?.includes(searchQuery) ||
      student.intake?.toLowerCase().includes(searchLower) ||
      student.course?.toLowerCase().includes(searchLower) ||
      student.status?.toLowerCase().includes(searchLower) ||
      student.address?.toLowerCase().includes(searchLower)
    );
  });

  const paginatedStudents = filteredStudents.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 1 }}>
        {/* Filter Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => setFilterOpen(!filterOpen)}>
              <FilterListIcon />
            </IconButton>
            {filterOpen && (
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ 
                    '& .MuiInputBase-root': {
                      height: '56px'
                    }
                  }}
                />
              </Box>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
            sx={{ height: '45px' }}
          >
            Add Student
          </Button>
        </Box>

        {/* Student Table */}
        <Box sx={{ height: 'calc(95vh - 250px)', display: 'flex', flexDirection: 'column' }}>
          <TableContainer 
            component={Paper} 
            sx={{ 
              mb: 2,
              maxHeight: '100%',
              overflow: 'auto',
              '& .MuiTableHead-root': {
                position: 'sticky',
                top: 0,
                zIndex: 1,
                backgroundColor: '#ffdef7'
              }
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell 
                    onClick={() => handleSort('name')}
                    sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                  >
                    Name {orderBy === 'name' && (order === 'asc' ? '▲' : '▼')}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('dob')}
                    sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                  >
                    DOB {orderBy === 'dob' && (order === 'asc' ? '▲' : '▼')}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('phoneNumber')}
                    sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                  >
                    Phone {orderBy === 'phoneNumber' && (order === 'asc' ? '▲' : '▼')}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('intake')}
                    sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                  >
                    Intake {orderBy === 'intake' && (order === 'asc' ? '▲' : '▼')}
                  </TableCell>
                  <TableCell 
                    align="center"
                    onClick={() => handleSort('status')}
                    sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                  >
                    Status {orderBy === 'status' && (order === 'asc' ? '▲' : '▼')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents
                  .sort((a, b) => compareValues(a, b, orderBy))
                  .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                  .map((student) => (
                    <TableRow 
                      key={student.id}
                      sx={{
                        transition: 'box-shadow 0.3s',
                        '&:hover': {
                          backgroundColor: '#f8f6ff',
                          boxShadow: '0 10px 10px -4px rgba(0,0,0,0.2), 0 -8px 8px -4px rgba(0,0,0,0.2)',
                          cursor: 'pointer'
                        }
                      }}
                    >
                      <TableCell>
                        <Typography>{student.name || 'N/A'}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {student.nricPassport || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{student.dob || 'N/A'}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {student.gender || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{student.phoneNumber || 'N/A'}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {student.country || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{student.intake || 'N/A'}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {student.course || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <FormControl fullWidth>
                          <Select
                            value={student.status || 'Active'}
                            onChange={(e) => handleStatusChange(student.id, e.target.value)}
                            size="small"
                          >
                            <MenuItem value="Active">Active</MenuItem>
                            <MenuItem value="Inactive">Inactive</MenuItem>
                            <MenuItem value="Graduated">Graduated</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          onClick={() => handleOpenModal(student)}
                          size="small"
                          sx={{ color: '#4CAF50' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDelete(student.id)}
                          size="small"
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
        </Box>

        {/* Pagination */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 3
        }}>
          <Pagination
            count={Math.ceil(filteredStudents.length / rowsPerPage)}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Box>

        {/* Add/Edit Student Modal */}
        <Modal open={openModal} onClose={handleCloseModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 800,
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {editMode ? 'Edit Student' : 'Add New Student'}
              </Typography>
              <IconButton onClick={handleCloseModal} sx={{ color: '#F44336' }}>
                <CloseIcon fontSize="large" />
              </IconButton>
            </Box>
            <Box sx={{ borderBottom: '2px solid #e0e0e0', mb: 4 }} />

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={currentStudent.name}
                  onChange={handleChange}
                  required
                  size="medium"
                  sx={{ '& .MuiInputBase-input': { fontSize: '1.1rem' } }}
                />
                <TextField
                  fullWidth
                  label="NRIC/Passport"
                  name="nricPassport"
                  value={currentStudent.nricPassport}
                  onChange={handleChange}
                  required
                  size="medium"
                  sx={{ '& .MuiInputBase-input': { fontSize: '1.1rem' } }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={currentStudent.gender}
                    onChange={handleChange}
                    required
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="DOB"
                  type="date"
                  name="dob"
                  value={currentStudent.dob}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    max: calculateDateLimits().max,
                    min: calculateDateLimits().min
                  }}
                  required
                />
                <TextField
                  fullWidth
                  label="Age"
                  name="age"
                  value={currentStudent.age}
                  disabled
                  sx={{ bgcolor: '#f5f5f5' }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Country</InputLabel>
                  <Select
                    name="country"
                    value={currentStudent.country}
                    onChange={handleChange}
                    required
                  >
                    {countries.map((country) => (
                      <MenuItem key={country.code} value={country.name}>
                        {country.name} ({country.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={currentStudent.phoneNumber}
                  onChange={handleChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Intake"
                  name="intake"
                  value={currentStudent.intake}
                  onChange={handleChange}
                  required
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={currentStudent.address}
                  onChange={handleChange}
                  required
                  sx={{ flex: 2 }}
                />
                <FormControl fullWidth sx={{ flex: 1 }}>
                  <InputLabel>Course</InputLabel>
                  <Select
                    name="course"
                    value={currentStudent.course}
                    onChange={handleChange}
                    required
                    disabled={editMode}
                    sx={{
                      bgcolor: editMode ? '#f5f5f5' : 'inherit'
                    }}
                  >
                    {availableCourses.map((course) => (
                      <MenuItem key={course.id} value={course.name}>
                        {course.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ borderBottom: '2px solid #e0e0e0', mb: 4 }} />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3, mt: 4 }}>
                {!editMode && (
                  <Button
                    variant="contained"
                    sx={{ 
                      bgcolor: '#e0e0e0', 
                      color: '#000',
                      fontSize: '1rem',
                      padding: '8px 24px',
                      '&:hover': {
                        bgcolor: '#9e9e9e', // Lighter grey on hover
                      }
                    }}
                    onClick={() => setCurrentStudent({
                      id: null,
                      name: '',
                      nricPassport: '',
                      gender: '',
                      dob: '',
                      age: '',
                      country: '',
                      phoneNumber: '',
                      intake: '',
                      course: '',
                      status: 'Active',
                      address: ''
                    })}
                  >
                    Clear
                  </Button>
                )}
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  sx={{
                    fontSize: '1rem',
                    padding: '8px 24px',
                    '&:hover': {
                      bgcolor: '#42a5f5', // Light blue on hover (maintain existing)
                    }
                  }}
                >
                  {editMode ? 'Update' : 'Submit'}
                </Button>
              </Box>
            </form>
          </Box>
        </Modal>

        {/* Snackbar for success messages */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbarSeverity} 
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default Students;