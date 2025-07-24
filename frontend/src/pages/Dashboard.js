import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="container mt-4">
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard.</p>
      <Link to="/groups" className="btn btn-primary">Go to Groups</Link>
    </div>
  );
};

export default Dashboard;
