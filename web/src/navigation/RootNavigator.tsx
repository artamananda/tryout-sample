import { BrowserRouter as Router, Route, Routes  } from "react-router-dom";
import { DashboardScreen } from "../screens/Dashboard";
import HomeScreen from "../screens/Home";
import LoginScreen from "../screens/Login";
import NotFoundScreen from "../screens/NotFound";

const RootNavigator = () => {
    return(
        <Router>
            <Routes>
                <Route path="/" element={<HomeScreen/>}/>
                <Route path="/login" element={<LoginScreen/>}/>
                <Route path="/dashboard" element={<DashboardScreen/>}/>
                <Route path="*" element={<NotFoundScreen />} />
            </Routes>
        </Router>
    );
}

export default RootNavigator;