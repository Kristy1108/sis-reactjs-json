import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';
import GradeIcon from '@mui/icons-material/Grade';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { Avatar } from '@mui/material';
import Drawer from '@mui/material/Drawer';
import useMediaQuery from '@mui/material/useMediaQuery';

import './Dashboard.css';

const MainLayout = ({ children, title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [username, setUsername] = useState('Admin');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:1000px)');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUsername(user.email.split('@')[0]);
    }
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure to log out?');
    if (confirmLogout) {
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const sidebarContent = (
    <>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        position: 'relative',
        height: isSidebarOpen ? 'auto' : '64px'
      }}>
        {isSidebarOpen && <img src="/Sushi.png" alt="Logo" style={{ height: '180px' }} />}
        {!isMobile && (
          <IconButton 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            sx={{ 
              color: 'white', 
              position: 'absolute', 
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)'
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Box>
      <List>
        {[
          { path: '/dashboard', icon: <DashboardIcon sx={{ fontSize: '40px' }} />, text: 'Dashboard' },
          { path: '/students', icon: <PeopleIcon sx={{ fontSize: '40px' }} />, text: 'Students' },
          { path: '/teachers', icon: <SchoolIcon sx={{ fontSize: '40px' }} />, text: 'Teachers' },
          { path: '/courses', icon: <BookIcon sx={{ fontSize: '40px' }} />, text: 'Courses' },
          { path: '/grade-management', icon: <GradeIcon sx={{ fontSize: '40px' }} />, text: 'Grade Management' },
        ].map((item) => (
          <ListItem
            key={item.path}
            button
            onClick={() => {
              handleNavigation(item.path);
              if (isMobile) {
                setMobileOpen(false);
              }
            }}
            sx={{
              backgroundColor: location.pathname === item.path ? '#F0F4F8' : 'transparent',
              color: location.pathname === item.path ? '#932C42' : '#B5B5C3',
              '&:hover': { 
                backgroundColor: '#000000',
                color: 'white',
              },
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: location.pathname === item.path ? '#389BFF' : '#B5B5C3',
                '&:hover': {
                  color: '#389BFF'
                }
              }}
            >
              {item.icon}
            </ListItemIcon>
            {(isSidebarOpen || isMobile) && (
              <ListItemText
                primary={
                  <Typography style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                    {item.text}
                  </Typography>
                }
              />
            )}
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden', width: '100vw' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Box
          sx={{
            width: isSidebarOpen ? '300px' : '100px',
            transition: 'width 0.3s',
            overflow: 'hidden',
            backgroundColor: '#1E1E2D',
            color: 'white',
            position: 'fixed',
            height: '100vh',
            zIndex: 1000,
            left: 0,
          }}
        >
          {sidebarContent}
        </Box>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <>
          <Box
            sx={{
              height: '64px',
              backgroundColor: '#1E1E2D',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              px: 2,
              paddingLeft: '30px',
            }}
          >
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                color: 'white',
                ml: 1
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
          <Drawer
            variant="temporary"
            anchor="left"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              '& .MuiDrawer-paper': {
                width: '300px',
                backgroundColor: '#1E1E2D',
                color: 'white',
              },
            }}
          >
            {sidebarContent}
          </Drawer>
        </>
      )}

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          p: isMobile ? 2 : 4,
          pl: isMobile ? 4 : 4,
          marginLeft: isMobile ? 0 : (isSidebarOpen ? '300px' : '100px'),
          marginTop: isMobile ? '64px' : 0,
          transition: 'margin-left 0.3s',
          
          height: '100vh',
          backgroundColor: '#f0f4f8',
          width: '100%',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 1,
          mt: isMobile ? 2 : 0,
        }}>
          <Typography 
            variant="h4" 
            fontWeight="bold"
            sx={{
              fontSize: isMobile ? '1.8rem' : '2.125rem',
              ml: isMobile ? 1 : 0,
              mb: 1,
              py: 1,
            }}
          >
            {title}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? 1 : 2,
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mr: isMobile ? 1 : 2,
                display: isMobile ? 'none' : 'block',
              }}
            >
              ({username})
            </Typography>
            <Avatar 
              sx={{ 
                width: isMobile ? '40px' : '50px',
                height: isMobile ? '40px' : '50px',
                bgcolor: '#389BFF', 
                fontSize: isMobile ? '1.2rem' : '1.5rem',
                fontWeight: 'bold'
              }}
            >
              {username[0].toUpperCase()}
            </Avatar>
            <IconButton
              onClick={handleLogout}
              sx={{
                backgroundColor: '#ff4444',
                color: 'white',
                width: isMobile ? '35px' : '40px',
                height: isMobile ? '35px' : '40px',
                '&:hover': {
                  backgroundColor: '#cc0000'
                }
              }}
            >
              <LogoutIcon sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
            </IconButton>
          </Box>
        </Box>

        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;