import { Route, Routes } from "react-router-dom";
import ViewerRoom from "./components/organisms/LiveViewerRoom";
import Layout from "./components/templates/Layout";
import Home from "./pages/Home";
import Viewer from "./pages/Viewer";

function App() {
  return (
    <Routes>
      <Route path='/' element={<Layout />}>
        <Route path='' element={<Home />} />
        <Route path='/viewer' element={<Viewer />} />
      </Route>
    </Routes>
  );
}

export default App;
