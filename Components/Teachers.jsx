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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Snackbar,
  Alert,
  Checkbox,
  ListItemText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import InputAdornment from '@mui/material/InputAdornment';
import axios from 'axios';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  components: {
    MuiModal: {
      defaultProps: {
        disableBackdrop: true,
      },
    },
  },
});

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState({
    id: null,
    name: '',
    nricPassport: '',
    gender: '',
    dob: '',
    age: '',
    country: '',
    phoneNumber: '',
    joinedDate: '',
    courses: [],
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
  const [availableCourses, setAvailableCourses] = useState([]);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

  const countries = [
    { code: '+60', name: 'Malaysia' },
    { code: '+65', name: 'Singapore' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teachersResponse, coursesResponse] = await Promise.all([
          axios.get('http://localhost:3001/teachers'),
          axios.get('http://localhost:3001/courses')
        ]);
        setTeachers(teachersResponse.data);
        const courseNames = coursesResponse.data.map(course => course.name);
        setAvailableCourses(courseNames);
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbarMessage('Error fetching data');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };

    fetchData();
  }, []);

  const handleOpenModal = (teacher = null) => {
    if (teacher) {
      setCurrentTeacher({
        ...teacher,
        courses: teacher.courses || (teacher.course ? [teacher.course] : []),
        phoneNumber: teacher.phoneNumber
      });
      setEditMode(true);
    } else {
      setCurrentTeacher({
        id: null,
        name: '',
        nricPassport: '',
        gender: '',
        dob: '',
        age: '',
        country: '',
        phoneNumber: '',
        joinedDate: '',
        courses: [],
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
    
    if (name === 'courses') {
      setCurrentTeacher(prev => ({
        ...prev,
        courses: typeof value === 'string' ? value.split(',') : value
      }));
    } else {
      setCurrentTeacher(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (name === 'dob') {
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      setCurrentTeacher((prev) => ({
        ...prev,
        age,
      }));
    }

    if (name === 'country') {
      const countryCode = countries.find((c) => c.name === value)?.code || '';
      setCurrentTeacher((prev) => ({
        ...prev,
        phoneNumber: countryCode,
      }));
    }
  };

  const calculateDateLimits = () => {
    const today = new Date();
    
    // Max date: 25 years ago from today
    const maxDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
    
    // Min date: 70 years ago (reasonable working age limit)
    const minDate = new Date(today.getFullYear() - 70, today.getMonth(), today.getDate());
    
    return {
      max: maxDate.toISOString().split('T')[0],
      min: minDate.toISOString().split('T')[0]
    };
  };

  const validateNRIC = async (nric, currentId = null) => {
    try {
      // Get all teachers and students
      const [teachersRes, studentsRes] = await Promise.all([
        axios.get('http://localhost:3001/teachers'),
        axios.get('http://localhost:3001/students')
      ]);

      // Check if NRIC exists in teachers (excluding current teacher if editing)
      const teacherExists = teachersRes.data.some(teacher => 
        teacher.nricPassport === nric && teacher.id !== currentId
      );

      // Check if NRIC exists in students
      const studentExists = studentsRes.data.some(student => 
        student.nricPassport === nric
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
    const isNRICValid = await validateNRIC(currentTeacher.nricPassport, currentTeacher.id);
    if (!isNRICValid) {
      setSnackbarMessage('NRIC/Passport already exists in the system');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Validate phone number
    const phoneNumber = currentTeacher.phoneNumber.replace(/\D/g, '');
    if (phoneNumber.length < 6) {
      setSnackbarMessage('Phone number must be at least 6 digits');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const teacherData = {
        ...currentTeacher,
        // Generate ID only for new teachers
        id: currentTeacher.id || generateId(),
        // Ensure courses is always an array
        courses: currentTeacher.courses || [],
        // Ensure status is set
        status: currentTeacher.status || 'Active'
      };

      if (editMode) {
        await axios.put(`http://localhost:3001/teachers/${teacherData.id}`, teacherData);
        setSnackbarMessage('Teacher updated successfully!');
      } else {
        // For new teacher, use POST
        await axios.post('http://localhost:3001/teachers', teacherData);
        setSnackbarMessage('Teacher added successfully!');
      }

      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Refresh teachers list
      const response = await axios.get('http://localhost:3001/teachers');
      setTeachers(response.data);
      
      handleCloseModal();
    } catch (error) {
      console.error('Error:', error);
      setSnackbarMessage('Failed to update teacher details: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Add generateId function if not already present
  const generateId = () => {
    // Generate a 4-character random string
    return Math.random().toString(36).substring(2, 6);
  };

  const handleDelete = async (teacherId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this teacher?');
    if (confirmDelete) {
      try {
        // Delete the teacher
        await axios.delete(`http://localhost:3001/teachers/${teacherId}`);
        
        // Update local state by removing the deleted teacher
        setTeachers(prevTeachers => 
          prevTeachers.filter(teacher => teacher.id !== teacherId)
        );

        // Show success message
        setSnackbarMessage('Teacher deleted successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        console.error('Error deleting teacher:', error);
        setSnackbarMessage('Failed to delete teacher: ' + error.message);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleStatusChange = async (teacherId, newStatus) => {
    try {
      // Find the current teacher
      const teacher = teachers.find(t => t.id === teacherId);
      if (!teacher) {
        throw new Error('Teacher not found');
      }

      // Create updated teacher data
      const updatedTeacher = {
        ...teacher,
        status: newStatus
      };

      // Send the update request with the complete teacher data
      await axios.put(`http://localhost:3001/teachers/${teacherId}`, updatedTeacher);
      
      // Update local state
      const updatedTeachers = teachers.map(t => 
        t.id === teacherId ? { ...t, status: newStatus } : t
      );
      setTeachers(updatedTeachers);

      // Show success message
      setSnackbarMessage('Teacher status updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error updating teacher status:', error);
      setSnackbarMessage('Failed to update teacher status: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
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
    if (['dob', 'joinedDate'].includes(property)) {
      return order === 'asc' ? 
        new Date(a[property]) - new Date(b[property]) : 
        new Date(b[property]) - new Date(a[property]);
    }
    
    // Handle arrays (courses)
    if (property === 'courses') {
      const aValue = (a[property] || []).join(', ').toLowerCase();
      const bValue = (b[property] || []).join(', ').toLowerCase();
      return order === 'asc' ? 
        aValue.localeCompare(bValue) : 
        bValue.localeCompare(aValue);
    }
    
    // Handle string values
    const valueA = (a[property] || '').toString().toLowerCase();
    const valueB = (b[property] || '').toString().toLowerCase();
    
    return order === 'asc' ? 
      valueA.localeCompare(valueB) : 
      valueB.localeCompare(valueA);
  };

  const filteredTeachers = teachers
    .filter(teacher => {
      const searchLower = searchQuery.toLowerCase();
      return (
        teacher.name.toLowerCase().includes(searchLower) ||
        teacher.nricPassport.toLowerCase().includes(searchLower) ||
        teacher.gender.toLowerCase().includes(searchLower) ||
        teacher.dob.includes(searchQuery) ||
        teacher.age.toString().includes(searchQuery) ||
        teacher.country.toLowerCase().includes(searchLower) ||
        teacher.phoneNumber.includes(searchQuery) ||
        teacher.joinedDate.includes(searchQuery) ||
        teacher.courses?.some(course => course.toLowerCase().includes(searchLower)) ||
        teacher.status.toLowerCase().includes(searchLower) ||
        teacher.address.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => compareValues(a, b, orderBy));

  const paginatedTeachers = filteredTeachers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 1 }}>
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
            Add Teacher
          </Button>
        </Box>

        <Box sx={{ height: 'calc(100vh - 250px)', display: 'flex', flexDirection: 'column' }}>
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
                    onClick={() => handleSort('joinedDate')}
                    sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                  >
                    Joined Date {orderBy === 'joinedDate' && (order === 'asc' ? '▲' : '▼')}
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
                {paginatedTeachers.map((teacher) => (
                  <TableRow 
                    key={teacher.teacherID}
                    sx={{
                      transition: 'box-shadow 0.2s',
                      '&:hover': {
                        backgroundColor: '#fafffd',
                        boxShadow: '0 10px 10px -4px rgba(0,0,0,0.2), 0 -8px 8px -4px rgba(0,0,0,0.2)',
                        cursor: 'pointer'
                      }
                    }}
                  >
                    <TableCell>
                      <Typography>{teacher.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {teacher.nricPassport}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography>{teacher.dob}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {teacher.gender}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography>{teacher.phoneNumber}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {teacher.country}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography>{teacher.joinedDate}</Typography>
                      <Typography 
                        variant="body2" 
                        color="textSecondary"
                        sx={{ whiteSpace: 'pre-line' }}
                      >
                        {teacher.courses ? 
                          teacher.courses.join(',\n') : 
                          teacher.course
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FormControl fullWidth>
                        <Select
                          value={teacher.status}
                          onChange={(e) => handleStatusChange(teacher.id, e.target.value)}
                          MenuProps={{
                            disablePortal: true,
                            BackdropProps: {
                              invisible: true,
                            },
                            PaperProps: {
                              style: {
                                marginTop: '8px',
                              },
                            },
                          }}
                        >
                          <MenuItem value="Active">Active</MenuItem>
                          <MenuItem value="Inactive">Inactive</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => handleOpenModal(teacher)}
                        sx={{ color: '#4CAF50' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDelete(teacher.id)}
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

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mt: 3
          }}>
            <Pagination
              count={Math.ceil(filteredTeachers.length / rowsPerPage)}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </Box>

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
                {editMode ? 'Edit Teacher' : 'Add New Teacher'}
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
                  value={currentTeacher.name}
                  onChange={handleChange}
                  required
                  size="medium"
                  sx={{ '& .MuiInputBase-input': { fontSize: '1.1rem' } }}
                />
                <TextField
                  fullWidth
                  label="NRIC/Passport"
                  name="nricPassport"
                  value={currentTeacher.nricPassport}
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
                    value={currentTeacher.gender}
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
                  value={currentTeacher.dob}
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
                  value={currentTeacher.age}
                  disabled
                  sx={{ bgcolor: '#f5f5f5' }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Country</InputLabel>
                  <Select
                    name="country"
                    value={currentTeacher.country}
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
                  value={currentTeacher.phoneNumber}
                  onChange={handleChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Joined Date"
                  type="date"
                  name="joinedDate"
                  value={currentTeacher.joinedDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel id="courses-label">Courses</InputLabel>
                  <Select
                    labelId="courses-label"
                    id="courses"
                    multiple
                    value={currentTeacher.courses || []}
                    onChange={handleChange}
                    name="courses"
                    renderValue={(selected) => selected.join(', ')}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                          width: 350,
                        }
                      },
                      anchorOrigin: {
                        vertical: 'bottom',
                        horizontal: 'left'
                      },
                      transformOrigin: {
                        vertical: 'top',
                        horizontal: 'left'
                      }
                    }}
                  >
                    {availableCourses.map((course) => (
                      <MenuItem key={course} value={course} sx={{ 
                        whiteSpace: 'normal',
                        wordBreak: 'break-word'
                      }}>
                        <Checkbox checked={(currentTeacher.courses || []).indexOf(course) > -1} />
                        <ListItemText primary={course} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  sx={{ flex: 1 }}
                  label="Address"
                  name="address"
                  value={currentTeacher.address}
                  onChange={handleChange}
                  required
                />
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
                        bgcolor: '#9e9e9e',
                      }
                    }}
                    onClick={() => setCurrentTeacher({
                      id: null,
                      name: '',
                      nricPassport: '',
                      gender: '',
                      dob: '',
                      age: '',
                      country: '',
                      phoneNumber: '',
                      joinedDate: '',
                      courses: [],
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
                      bgcolor: '#42a5f5',
                    }
                  }}
                >
                  {editMode ? 'Update' : 'Submit'}
                </Button>
              </Box>
            </form>
          </Box>
        </Modal>

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

export default Teachers;
