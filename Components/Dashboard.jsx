import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { LineChart, PieChart } from '@mui/x-charts';
import axios from 'axios';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';
import GradeIcon from '@mui/icons-material/Grade';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Create theme with sans-serif font
const theme = createTheme({
  typography: {
    fontFamily: 'sans-serif',
  },
});

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    // Fetch data from the mock API
    axios.get('http://localhost:3001/students').then((response) => setStudents(response.data));
    axios.get('http://localhost:3001/teachers').then((response) => setTeachers(response.data));
    axios.get('http://localhost:3001/courses').then((response) => setCourses(response.data));
    axios.get('http://localhost:3001/grades').then((response) => setGrades(response.data));
  }, []);

  const feeCollectionData = [
    { month: 'Jan', fee: 6000 },
    { month: 'Feb', fee: 7000 },
    { month: 'Mar', fee: 6000 },
    { month: 'Apr', fee: 5000 },
  ];

  // Get only active students
  const activeStudents = students.filter(student => student.status === 'Active');

  // Calculate total students per course (active students only)
  const getStudentsPerCourse = () => {
    const courseCount = {};
    
    // Initialize counts for all courses
    courses.forEach(course => {
      courseCount[course.name] = 0;
    });
    
    // Count only active students in each course
    activeStudents.forEach(student => {
      if (student.course && courseCount.hasOwnProperty(student.course)) {
        courseCount[student.course]++;
      }
    });
    
    // Convert to array format for chart
    return {
      labels: Object.keys(courseCount),
      data: Object.values(courseCount)
    };
  };

  // Calculate average grade per course
  const getAverageGradePerCourse = () => {
    const gradePoints = {
      'A+': 4.0,
      'A': 4.0,
      'A-': 3.7,
      'B+': 3.3,
      'B': 3.0,
      'B-': 2.7,
      'C+': 2.3,
      'C': 2.0,
      'F': 0.0
    };

    const courseGrades = {};
    const courseCount = {};

    // Initialize all courses
    courses.forEach(course => {
      courseGrades[course.name] = 0;
      courseCount[course.name] = 0;
    });

    // Calculate total grade points for each course
    grades.forEach(grade => {
      if (grade.grade && grade.grade !== '') {
        const student = students.find(s => s.id === grade.ID);
        if (student && student.course) {
          courseGrades[student.course] += gradePoints[grade.grade] || 0;
          courseCount[student.course]++;
        }
      }
    });

    // Calculate averages and format for PieChart
    return Object.entries(courseGrades).map(([course, total]) => ({
      id: course,
      label: course,
      value: courseCount[course] ? (total / courseCount[course]).toFixed(2) : 0,
    }));
  };

  const avgGradeData = getAverageGradePerCourse();

  // Gender distribution chart with updated colors
  const studentGenderData = [
    { 
      id: 'Male',
      label: 'Male', 
      value: activeStudents.filter(s => s.gender === 'Male').length,
      color: '#FF6384' // Pink
    },
    { 
      id: 'Female',
      label: 'Female', 
      value: activeStudents.filter(s => s.gender === 'Female').length,
      color: '#36A2EB' // Blue
    }
  ];

  const studentsPerCourse = getStudentsPerCourse();

  return (
    <ThemeProvider theme={theme}>
      <Box>
        {/* Monthly Collected Fee Chart */}
        <Paper sx={{ p: 3, mb: 4, backgroundColor: 'white' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Monthly Collected Fee
          </Typography>
          <Box sx={{ width: '100%', height: '300px' }}>
            <LineChart
              xAxis={[{ 
                data: feeCollectionData.map(d => d.month), 
                scaleType: 'band' 
              }]}
              series={[{ 
                data: feeCollectionData.map(d => d.fee),
                color: '#389BFF'
              }]}
              width={undefined}
              height={300}
              sx={{ width: '100%' }}
            />
          </Box>
        </Paper>

        {/* Metrics Cards */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 4,
          mb: 4
        }}>
          <Paper sx={{ 
            p: 4,
            backgroundColor: '#FFF4DE',
            borderRadius: '16px',
            position: 'relative',
            height: '120px'
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
                {activeStudents.length}
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
              ACTIVE STUDENTS
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 4, 
            backgroundColor: '#E1F0FF',
            borderRadius: '16px',
            position: 'relative',
            height: '120px'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              pt: 1,
              pb: 2
            }}>
              <SchoolIcon sx={{ fontSize: 40, color: '#3699FF' }} />
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  color: '#3699FF'
                }}
              >
                {teachers.length}
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
              TEACHERS
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 4, 
            backgroundColor: '#FFE2E5',
            borderRadius: '16px',
            position: 'relative',
            height: '120px'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              pt: 1,
              pb: 2
            }}>
              <BookIcon sx={{ fontSize: 40, color: '#F64E60' }} />
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  color: '#F64E60'
                }}
              >
                {courses.length}
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
              COURSES
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 4, 
            backgroundColor: '#C9F7F5',
            borderRadius: '16px',
            position: 'relative',
            height: '120px'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              pt: 1,
              pb: 2
            }}>
              <GradeIcon sx={{ fontSize: 40, color: '#1DC6BE' }} />
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  color: '#1DC6BE'
                }}
              >
                {students.filter((s) => s.status === 'Graduated').length}
              </Typography>
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                position: 'absolute',
                bottom: '2rem',
                left: '2rem',
                fontWeight: 700,
                color: '#1DC6BE'
              }}
            >
              GRADUATED STUDENTS
            </Typography>
          </Paper>
        </Box>

        {/* Charts */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: 4, 
          mb: 4 
        }}>
          <Paper sx={{ p: 3, backgroundColor: 'white' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              New Students per Intake
            </Typography>
            <Box sx={{ width: '100%', height: '300px' }}>
              <LineChart
                xAxis={[{ data: ['Dec 2023', 'Jan 2024', 'Feb 2024'], scaleType: 'band' }]}
                series={[{ data: [4, 6, 8] }]}
                width={undefined}
                height={300}
                sx={{ width: '100%' }}
              />
            </Box>
          </Paper>
          <Paper sx={{ p: 3, backgroundColor: 'white' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Total Active Students per Course
            </Typography>
            <Box sx={{ width: '100%', height: '300px' }}>
              <LineChart
                xAxis={[{ 
                  data: studentsPerCourse.labels,
                  scaleType: 'band' 
                }]}
                series={[{ 
                  data: studentsPerCourse.data
                }]}
                width={undefined}
                height={300}
                sx={{ width: '100%' }}
              />
            </Box>
          </Paper>
        </Box>

        {/* Gender and Average Grade Charts */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: 4, 
          mb: 2 
        }}>
          <Paper sx={{ p: 3, backgroundColor: 'white', mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Gender of Active Students
            </Typography>
            <Box sx={{ width: '100%', height: '300px' }}>
              <PieChart 
                series={[{ 
                  data: studentGenderData,
                  highlightScope: { faded: 'global', highlighted: 'item' },
                }]}
                slotProps={{
                  legend: {
                    direction: 'row',
                    position: { vertical: 'top', horizontal: 'right' },
                    padding: 0,
                    itemMarkWidth: 10,
                    itemMarkHeight: 10,
                    markGap: 5,
                    itemGap: 10,
                  },
                }}
                width={undefined}
                height={300}
                sx={{ width: '100%' }}
              />
            </Box>
          </Paper>
          <Paper sx={{ p: 3, backgroundColor: 'white', mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Average Grade per Course
            </Typography>
            <Box sx={{ width: '100%', height: '300px'}}>
              <PieChart 
                series={[{ 
                  data: avgGradeData,
                  highlightScope: { faded: 'global', highlighted: 'item' },
                }]}
                slotProps={{
                  legend: {
                    direction: 'column',
                    position: { vertical: 'top', horizontal: 'right' },
                    padding: 0,
                    itemMarkWidth: 10,
                    itemMarkHeight: 10,
                    markGap: 5,
                    itemGap: 10,
                  },
                }}
                colors={['#FF9F40', '#4BC0C0', '#FFCD56', '#FF6384']}
                width={undefined}
                height={300}
                sx={{ width: '100%' }}
              />
            </Box>
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;