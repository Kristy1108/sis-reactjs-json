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
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Snackbar,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const GradeManagement = () => {
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [intakeSearch, setIntakeSearch] = useState('');
  const [currentGrade, setCurrentGrade] = useState({
    ID: '',
    name: '',
    homework: '',
    assignment: '',
    groupDiscussion: '',
    project: '',
    totalScore: '',
    grade: ''
  });
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gradesRes, studentsRes, coursesRes] = await Promise.all([
        axios.get('http://localhost:3001/grades'),
        axios.get('http://localhost:3001/students'),
        axios.get('http://localhost:3001/courses')
      ]);
      setGrades(gradesRes.data);
      setStudents(studentsRes.data);
      setCourses(coursesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const calculateGrade = (totalScore) => {
    if (totalScore >= 90) return 'A+';
    if (totalScore >= 80) return 'A';
    if (totalScore >= 70) return 'B';
    if (totalScore >= 60) return 'C';
    if (totalScore >= 50) return 'D';
    return 'F';
  };

  const handleCalculateTotal = (hw, assign, disc, proj) => {
    const total = Number(hw || 0) + Number(assign || 0) + Number(disc || 0) + Number(proj || 0);
    const grade = calculateGrade(total);
    setCurrentGrade(prev => ({
      ...prev,
      totalScore: total,
      grade: grade
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validation for score ranges
    if (name === 'homework' || name === 'assignment' || name === 'groupDiscussion') {
      if (value && (value < 1 || value > 10)) return;
    }
    if (name === 'project' && value && (value < 1 || value > 70)) return;

    setCurrentGrade(prev => ({
      ...prev,
      [name]: value
    }));

    // Calculate total score and grade when any score field changes
    if (['homework', 'assignment', 'groupDiscussion', 'project'].includes(name)) {
      handleCalculateTotal(
        name === 'homework' ? value : currentGrade.homework,
        name === 'assignment' ? value : currentGrade.assignment,
        name === 'groupDiscussion' ? value : currentGrade.groupDiscussion,
        name === 'project' ? value : currentGrade.project
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Find the existing grade record
      const existingGrade = grades.find(g => 
        g.ID === currentGrade.ID && 
        g.subjectID === currentGrade.subjectID
      );

      if (existingGrade) {
        // Update existing grade
        await axios.put(`http://localhost:3001/grades/${existingGrade.id}`, {
          ...existingGrade,
          homework: currentGrade.homework,
          assignment: currentGrade.assignment,
          groupDiscussion: currentGrade.groupDiscussion,
          project: currentGrade.project,
          totalScore: currentGrade.totalScore,
          grade: currentGrade.grade
        });
        setSnackbarMessage('Grade updated successfully!');
      } else {
        // Add new grade
        await axios.post('http://localhost:3001/grades', {
          id: uuidv4(),
          ID: currentGrade.ID,
          subjectID: currentGrade.subjectID,
          homework: currentGrade.homework,
          assignment: currentGrade.assignment,
          groupDiscussion: currentGrade.groupDiscussion,
          project: currentGrade.project,
          totalScore: currentGrade.totalScore,
          grade: currentGrade.grade
        });
        setSnackbarMessage('Grade added successfully!');
      }
      
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchData();
      setOpenModal(false);
    } catch (error) {
      console.error('Error:', error);
      setSnackbarMessage('Failed to save grade');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async (gradeID) => {
    if (window.confirm('Are you sure you want to delete this grade?')) {
      try {
        // Find the grade record to delete
        const gradeToDelete = grades.find(g => g.id === gradeID);
        
        if (!gradeToDelete) {
          throw new Error('Grade not found');
        }

        await axios.delete(`http://localhost:3001/grades/${gradeToDelete.id}`);
        setSnackbarMessage('Grade deleted successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        fetchData();
      } catch (error) {
        console.error('Error:', error);
        setSnackbarMessage('Failed to delete grade');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleEditGrade = (grade) => {
    const student = students.find(s => s.id === grade.ID);
    setCurrentGrade({
      ...grade,
      name: student?.name || '',
      subjectID: grade.subjectID // Make sure subjectID is included
    });
    setOpenModal(true);
  };

  const filteredGrades = grades.filter(grade => {
    const student = students.find(s => s.id === grade.ID);
    const studentCourse = student?.course || '';
    const studentIntake = student?.intake || '';
    
    return (
      (!selectedCourse || studentCourse === selectedCourse) &&
      (!selectedSubject || grade.subjectID === selectedSubject) &&
      (!intakeSearch || studentIntake.toLowerCase().includes(intakeSearch.toLowerCase()))
    );
  });

  // Add function to get available subjects for selected course
  const getAvailableSubjects = () => {
    const selectedCourseData = courses.find(c => c.name === selectedCourse);
    return selectedCourseData ? selectedCourseData.subjects : [];
  };

  // Reset subject selection when course changes
  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
    setSelectedSubject(''); // Reset subject when course changes
  };

  // Add this function to handle pagination
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // Modify the table section to include pagination
  const paginatedGrades = filteredGrades.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Add this helper function to get subject name
  const getSubjectName = (subjectID) => {
    for (const course of courses) {
      const subject = course.subjects.find(s => s.subjectID === subjectID);
      if (subject) {
        return subject.subjectName;
      }
    }
    return subjectID; // Fallback to ID if name not found
  };

  // Add these sorting functions
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const compareValues = (a, b, property) => {
    if (property === 'name') {
      const studentA = students.find(s => s.id === a.ID);
      const studentB = students.find(s => s.id === b.ID);
      const nameA = (studentA?.name || '').toLowerCase();
      const nameB = (studentB?.name || '').toLowerCase();
      return order === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    }

    // Handle numeric values
    if (['totalScore', 'homework', 'assignment', 'groupDiscussion', 'project'].includes(property)) {
      return order === 'asc' ? 
        Number(a[property] || 0) - Number(b[property] || 0) : 
        Number(b[property] || 0) - Number(a[property] || 0);
    }
    
    // Handle string values
    const valueA = (a[property] || '').toString().toLowerCase();
    const valueB = (b[property] || '').toString().toLowerCase();
    
    return order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* Filters Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => setFilterOpen(!filterOpen)}>
          <FilterListIcon />
        </IconButton>
        
        {filterOpen && (
          <Box sx={{ display: 'flex', gap: 2, ml: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Course</InputLabel>
              <Select
                value={selectedCourse}
                onChange={handleCourseChange}
                label="Course"
              >
                <MenuItem value="">All Courses</MenuItem>
                {courses.map(course => (
                  <MenuItem key={course.courseID} value={course.name}>
                    {course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }} disabled={!selectedCourse}>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                label="Subject"
              >
                <MenuItem value="">All Subjects</MenuItem>
                {getAvailableSubjects().map(subject => (
                  <MenuItem key={subject.subjectID} value={subject.subjectID}>
                    {subject.subjectName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Intake"
              value={intakeSearch}
              onChange={(e) => setIntakeSearch(e.target.value)}
              sx={{ width: 200 }}
              disabled={!selectedCourse}
            />
          </Box>
        )}
      </Box>

      {/* Grades Table */}
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
                  onClick={() => handleSort('ID')}
                  sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                >
                  ID {orderBy === 'ID' && (order === 'asc' ? '▲' : '▼')}
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('name')}
                  sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                >
                  Name {orderBy === 'name' && (order === 'asc' ? '▲' : '▼')}
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('subjectID')}
                  sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                >
                  Subject {orderBy === 'subjectID' && (order === 'asc' ? '▲' : '▼')}
                </TableCell>
                <TableCell 
                  align="center"
                  onClick={() => handleSort('totalScore')}
                  sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                >
                  Total Score {orderBy === 'totalScore' && (order === 'asc' ? '▲' : '▼')}
                </TableCell>
                <TableCell 
                  align="center"
                  onClick={() => handleSort('grade')}
                  sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                >
                  Grade {orderBy === 'grade' && (order === 'asc' ? '▲' : '▼')}
                </TableCell>
                <TableCell 
                  align="center"
                  onClick={() => handleSort('homework')}
                  sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                >
                  Homework {orderBy === 'homework' && (order === 'asc' ? '▲' : '▼')}
                </TableCell>
                <TableCell 
                  align="center"
                  onClick={() => handleSort('assignment')}
                  sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                >
                  Assignment {orderBy === 'assignment' && (order === 'asc' ? '▲' : '▼')}
                </TableCell>
                <TableCell 
                  align="center"
                  onClick={() => handleSort('groupDiscussion')}
                  sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                >
                  Group Discussion {orderBy === 'groupDiscussion' && (order === 'asc' ? '▲' : '▼')}
                </TableCell>
                <TableCell 
                  align="center"
                  onClick={() => handleSort('project')}
                  sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
                >
                  Project {orderBy === 'project' && (order === 'asc' ? '▲' : '▼')}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGrades
                .sort((a, b) => compareValues(a, b, orderBy))
                .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                .map((grade) => {
                  const student = students.find(s => s.id === grade.ID);
                  return (
                    <TableRow 
                      key={`${grade.ID}-${grade.subjectID}`}
                      sx={{
                        transition: 'box-shadow 0.2s',
                        '&:hover': {
                          backgroundColor: '#fff7fd',
                          boxShadow: '0 10px 10px -4px rgba(0,0,0,0.2), 0 -8px 8px -4px rgba(0,0,0,0.2)',
                          cursor: 'pointer'
                        }
                      }}
                    >
                      <TableCell width="5%">{grade.ID}</TableCell>
                      <TableCell width="12%">
                        <Typography>{student?.name || 'N/A'}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {student?.nricPassport || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell width="19%">
                        <Typography>{getSubjectName(grade.subjectID)}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {student?.intake || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell 
                        width="9%" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: grade.totalScore >= 80 ? '#0000FF' : 
                                 grade.totalScore >= 50 ? '#008000' : 
                                 '#FF0000',
                          textAlign: 'center'
                        }}
                      >
                        {grade.totalScore}
                      </TableCell>
                      <TableCell 
                        width="9%" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: (grade.grade === 'A+' || grade.grade === 'A') ? '#0000FF' : 
                                 grade.grade === 'F' ? '#FF0000' : 
                                 '#008000',
                          textAlign: 'center'
                        }}
                      >
                        {grade.grade}
                      </TableCell>
                      <TableCell width="9%" sx={{ textAlign: 'center' }}>{grade.homework}</TableCell>
                      <TableCell width="9%" sx={{ textAlign: 'center' }}>{grade.assignment}</TableCell>
                      <TableCell width="9%" sx={{ textAlign: 'center' }}>{grade.groupDiscussion}</TableCell>
                      <TableCell width="9%" sx={{ textAlign: 'center' }}>{grade.project}</TableCell>
                      <TableCell width="10%">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <IconButton 
                            size="small"
                            onClick={() => handleEditGrade(grade)} 
                            sx={{ color: '#4CAF50' }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={() => handleDelete(grade.id)} 
                            sx={{ color: '#F44336' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add Pagination component */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 2,
        }}>
          <Pagination
            count={Math.ceil(filteredGrades.length / rowsPerPage)}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      </Box>

      {/* Edit Grade Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Edit Grade</Typography>
            <IconButton onClick={() => setOpenModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Name"
                value={currentGrade.name}
                disabled
                sx={{ flex: 4, bgcolor: '#f5f5f5' }}
              />
              <TextField
                label="Student ID"
                value={currentGrade.ID}
                disabled
                sx={{ flex: 1, bgcolor: '#f5f5f5' }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Homework (1-10)"
                name="homework"
                type="number"
                value={currentGrade.homework}
                onChange={handleChange}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Assignment (1-10)"
                name="assignment"
                type="number"
                value={currentGrade.assignment}
                onChange={handleChange}
                sx={{ flex: 1 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Group Discussion (1-10)"
                name="groupDiscussion"
                type="number"
                value={currentGrade.groupDiscussion}
                onChange={handleChange}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Project (1-70)"
                name="project"
                type="number"
                value={currentGrade.project}
                onChange={handleChange}
                sx={{ flex: 1 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Total Score"
                value={currentGrade.totalScore}
                disabled
                sx={{ flex: 1, bgcolor: '#f5f5f5' }}
              />
              <TextField
                label="Grade"
                value={currentGrade.grade}
                disabled
                sx={{ flex: 1, bgcolor: '#f5f5f5' }}
              />
            </Box>

            <Box sx={{ borderBottom: '2px solid #e0e0e0', mb: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="contained"
                color="inherit"
                onClick={() => setCurrentGrade({
                  ...currentGrade,
                  homework: '',
                  assignment: '',
                  groupDiscussion: '',
                  project: '',
                  totalScore: '',
                  grade: ''
                })}
              >
                Clear
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Submit
              </Button>
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
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GradeManagement;