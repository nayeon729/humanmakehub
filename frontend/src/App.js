// ✅ src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./common/HomePage";
import LoginPage from "./common/LoginPage";
import RegisterPage from "./common/RegisterPage";

import ClientDashBoard from "./client/ClientDashboard";
import ClientNoticeBoard from "./client/ClientNoticeBoard";
import ClientProjectCreatePage from "./client/ClientProjectCreatePage";
import ClientProjectList from "./client/ClientProjectList";
import ClientUserInfo from "./client/ClinetUserInfo";
import ClientUserUpdate from "./client/ClinetUserUpdate"; // 회원 정보 수정 페이지

// import PMDashboard from "./src/PMDashboard";
// import TeamBuilderPage from "./src/TeamBuilderPage";
// import TaskManagementPage from "./src/TaskManagementPage";
// import PMProjectDetailPage from "./src/PMProjectDetailPage";

import MemberTaskPage from "./member/MemberTaskPage";
// import MyPortfolioPage from "./MyPortfolioPage";

import AdminDashboard from './admin/AdminDashboard';
import AdminProjectManagementPage from "./admin/AdminProjectManagementPage";
import AdminAllProjectsPage from "./admin/AdminAllProjectsPage";
import AdminProjectDetailPage from "./admin/AdminProjectDetailPage"; // ✅ 추가
import AdminUserManagementPage from "./admin/AdminUserManagementPage";
import AdminAgreementPage from "./admin/AdminAgreementPage";
import NoticeCreatePage from "./admin/NoticeCreatePage";

import SidebarLayout from "./common/SidebarLayout";
import TopNavbar from "./common/TopNavbar";
import AdminNoticeCreatePage from "./admin/NoticeCreatePage";

function App() {
  return (
    <Router>
      <TopNavbar />
      <Routes>

        {/* 공통 */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 클라이언트 */}
        <Route element={<SidebarLayout role="client" />}>
          <Route path="/client/dashboard" element={<ClientDashBoard />} />
          <Route path="/client/notice" element={<ClientNoticeBoard />} />
          <Route path="/client/create" element={<ClientProjectCreatePage />} />
          <Route path="/client/projects" element={<ClientProjectList />} />
          <Route path="/client/project/:id" element={<ClientProjectList />} /> {/* 프로젝트 상세 페이지 */}
          <Route path="/client/userinfo" element={<ClientUserInfo />} />
          <Route path="/client/userupdate" element={<ClientUserUpdate />} /> {/* 회원 정보 수정 페이지 */}
        </Route>

        {/* PM */}
        <Route element={<SidebarLayout role="pm" />}>
          {/* <Route path="/pm/dashboard" element={<PMDashboard />} /> */}
          {/* <Route path="/pm/team" element={<TeamBuilderPage />} /> */}
          {/* <Route path="/pm/project/:projectId" element={<PMProjectDetailPage />} /> */}
          {/* <Route path="/pm/project/:projectId/tasks" element={<TaskManagementPage />} //> */}
        </Route>

        {/* 팀원 */}
        <Route element={<SidebarLayout role="member" />}>
          <Route path="/member/tasks" element={<MemberTaskPage />} />
          {/* <Route path="/member/portfolio" element={<MyPortfolioPage />} /> */}
        </Route>

        {/* 관리자 */}
        <Route element={<SidebarLayout role="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUserManagementPage />} />
          <Route path="/admin/projects/all" element={<AdminAllProjectsPage/>}/>
          <Route path="/admin/projects" element={<AdminProjectManagementPage />} />
          <Route path="/admin/project/:id" element={<AdminProjectDetailPage />} /> {/* ✅ 추가 */}
          <Route path="/admin/agreements" element={<AdminAgreementPage />} />
          <Route path="/admin/noticecreate" element={<NoticeCreatePage />}/>
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
