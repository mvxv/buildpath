import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import Library from './pages/Library.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import Quiz from './pages/Quiz.jsx';
import MyProjects from './pages/MyProjects.jsx';
import SavedProject from './pages/SavedProject.jsx';
import Deploy from './pages/Deploy.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="projects" element={<Library />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="quiz" element={<Quiz />} />
        <Route path="deploy" element={<Deploy />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />

        <Route
          path="my-projects"
          element={
            <ProtectedRoute>
              <MyProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-projects/:id"
          element={
            <ProtectedRoute>
              <SavedProject />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
