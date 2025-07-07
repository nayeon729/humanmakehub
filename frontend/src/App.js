// ✅ src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./common/HomePage";
import LoginPage from "./common/LoginPage";
import RegisterPage from "./common/RegisterPage";
import IdFind from "./common/IdFind";
import PwFind from "./common/PwFind";
// import IdFindView from "./common/IdFindView";
import PwReset from "./common/PwReset";

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
import NoticeListPage from "./admin/NoticeListPage";
import NoticeViewPage from "./admin/NoticeViewPage";
import NoticeUpdatePage from "./admin/NoticeUpdatePage";

import ProjectChannelCommon from "./admin/ProjectChannelCommon";

import PrivateRoute from "./common/PrivateRoute";
import SidebarLayout from "./common/SidebarLayout";
import ProjectChannel from "./common/ProjectChannel";
import TopNavbar from "./common/TopNavbar";

function App() {
  return (
    <Router>
      <TopNavbar />
      <Routes>


        {/* 공통 */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/idFind" element={<IdFind />} />
        <Route path="/pwFind" element={<PwFind />} />
        {/* <Route path="/idFindView" element={<IdFindView />} /> */}
        <Route path="/pwReset" element={<PwReset />} />

        {/* 클라이언트 */}
        <Route
          path="/client"
          element={
            <PrivateRoute allowedRoles={["client"]}>
              <SidebarLayout role="client" />
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<ClientDashBoard />} />
          <Route path="notice" element={<ClientNoticeBoard />} />
          <Route path="create" element={<ClientProjectCreatePage />} />
          <Route path="projects" element={<ClientProjectList />} />
          <Route path="project/:id" element={<ClientProjectList />} /> {/* 프로젝트 상세 페이지 */}
          <Route path="userinfo" element={<ClientUserInfo />} />
          <Route path="userupdate" element={<ClientUserUpdate />} /> {/* 회원 정보 수정 페이지 */}
          <Route path="notice/list" element={<NoticeListPage />} />

        </Route>


        {/* 팀원 */}
        <Route
          path="/member"
          element={
            <PrivateRoute allowedRoles={["member"]}>
              <SidebarLayout role="member" />
            </PrivateRoute>
          }
        >
          <Route path="tasks" element={<MemberTaskPage />} />
          {/* <Route path="/member/portfolio" element={<MyPortfolioPage />} /> */}
          <Route path="notice/list" element={<NoticeListPage />} />
        </Route>

        {/* 관리자 */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <SidebarLayout role="admin" />
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUserManagementPage />} />
          <Route path="projects/all" element={<AdminAllProjectsPage />} />
          <Route path="projects" element={<AdminProjectManagementPage />} />
          <Route path="project/:id" element={<AdminProjectDetailPage />} /> {/* ✅ 추가 */}
          <Route path="agreements" element={<AdminAgreementPage />} />
          <Route path="notice/create" element={<NoticeCreatePage />} />
          <Route path="notice/list" element={<NoticeListPage />} />
          <Route path="notice/:noticeId" element={<NoticeViewPage />} />
          <Route path="notice/:noticeId/update" element={<NoticeUpdatePage />} />

        </Route>
        <Route element={<ProjectChannel role="admin" />}>
          <Route path="/channel/:project_id/common" element={<ProjectChannelCommon />} />
          {/* <Route path="/channel/:project_id/member/:user_id" element={<MemberChannel />} /> */}
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
