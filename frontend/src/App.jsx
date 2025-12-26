import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landing";
import Authentication from "./pages/authentication";
import Videomeet from "./pages/videomeet";
import HomeComponent from "./pages/home";
import History from "./pages/history";
import { AuthProvider } from "./contexts/AuthContex";



function App() {
  
  return (
    <>
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage/>}/>

          <Route path="/auth" element={<Authentication/>}/>

          <Route path="/home" element = {<HomeComponent/>} />

           <Route path="/history" element = {<History/>} />

          <Route path="/:url" element ={<Videomeet/>}/>
        </Routes>
      </AuthProvider>
    </Router>
    
    </>
  )
}

export default App
