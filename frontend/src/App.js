// ✅ src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./common/homepage/HomePage";
import LoginPage from "./common/LoginPage";
import RegisterPage from "./common/RegisterPage";
import IdFind from "./common/IdFind";
import PwFind from "./common/PwFind";
// import IdFindView from "./common/IdFindView";
import PwReset from "./common/PwReset";
import PortfolioListTest from "../src/common/homepage/PortfolioListTest"
import { AlertProvider } from "./components/CommonAlert";

import ClientDashBoard from "./client/ClientDashboard";
import ClientProjectCreatePage from "./client/ClientProjectCreatePage";
import ClientProjectList from "./client/ClientProjectList";
import ClientUserInfo from "./client/ClinetUserInfo";
import ClientUserUpdate from "./client/ClinetUserUpdate"; // 회원 정보 수정 페이지

// import PMDashboard from "./src/PMDashboard";
// import TeamBuilderPage from "./src/TeamBuilderPage";
// import TaskManagementPage from "./src/TaskManagementPage";
// import PMProjectDetailPage from "./src/PMProjectDetailPage";

import MemberTaskPage from "./member/MemberTaskPage";
import MemberUserInfo from "./member/MemberUserInfo";
import MemberUserUpdate from "./member/MemberUserUpdate";
import MemberProjectList from "./member/MemberProjectList";
import ProjectChannelPmCreatePage from "./member/ProjectChannelPmCreatePage";
import ProjectChannelPmUpdatePage from "./member/ProjectChannelPmUpdatePage";

import AdminDashboard from './admin/AdminDashboard';
import AdminProjectManagementPage from "./admin/AdminProjectManagementPage";
import AdminAllProjectsPage from "./admin/AdminAllProjectsPage";
import AdminProjectDetailPage from "./admin/AdminProjectDetailPage"; // ✅ 추가
import AdminUserManagementPage from "./admin/AdminUserManagementPage";
import NoticeCreatePage from "./admin/NoticeCreatePage";
import NoticeListPage from "./admin/NoticeListPage";
import NoticeViewPage from "./admin/NoticeViewPage";
import NoticeUpdatePage from "./admin/NoticeUpdatePage";
import AdminAskListPage from "./admin/AdminAskListPage"
import AdminProjectCreatePage from "./admin/AdminProjectCreatePage";
import AdminProjectUpdatePage from "./admin/AdminProjectUpdatePage";
import AdminPortfolioList from "./admin/AdminPortfolioListPage"
import AdminPortfolioCreatePage from "./admin/AdminPortfolioCreatePage"
import AdminPortfolioUpdatePage from "./admin/AdminPortfolioUpdatePage"

import ProjectChannelCommon from "./admin/ProjectChannelCommon";
import ProjectChannelMember from "./admin/ProjectChannelMemberPage";
import ProjectChannelCreate from "./admin/ProjectChannelCreatePage";
import ProjectChannelUpdate from "./admin/ProjectChannelUpdatePage";
import ProjectChannelView from "./admin/ProjectChannelViewPage";

import PrivateRoute from "./common/PrivateRoute";
import SidebarLayout from "./common/SidebarLayout";
import ProjectChannel from "./common/ProjectChannel";
import TopNavbar from "./common/TopNavbar";
import ProjectChannelMemberPage from "./member/ProjectChannelPmPage";
import MemberProjectChannel from "./member/MemberProjectChannel";

function App() {
  return (
    <Router>
      <AlertProvider>
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
          <Route path="/t" element={<PortfolioListTest />} />


          {/* 클라이언트 */}
          <Route
            path="/client"
            element={
              <PrivateRoute allowedRoles={["R01"]}>
                <SidebarLayout role="client" />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<ClientDashBoard />} />
            <Route path="create" element={<ClientProjectCreatePage />} />
            <Route path="list" element={<ClientProjectList />} />
            <Route path="project/:id" element={<ClientProjectList />} /> {/* 프로젝트 상세 페이지 */}
            <Route path="userinfo" element={<ClientUserInfo />} />
            <Route path="userupdate" element={<ClientUserUpdate />} /> {/* 회원 정보 수정 페이지 */}
            <Route path="notice/list" element={<NoticeListPage />} />
            <Route path="notice/:noticeId" element={<NoticeViewPage />} />

          </Route>


          {/* 팀원 */}
          <Route
            path="/admin/member/:user_id"
            element={
              <PrivateRoute allowedRoles={["R03", "R04"]}>  {/* 관리자 전용 */}
                <MemberUserInfo />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/client/:user_id"
            element={
              <PrivateRoute allowedRoles={["R03", "R04"]}>  {/* 관리자 전용 */}
                <ClientUserInfo />
              </PrivateRoute>
            }
          />

          <Route
            path="/member"
            element={
              <PrivateRoute allowedRoles={["R02"]}>
                <SidebarLayout role="Developer" />
              </PrivateRoute>
            }
          >
            <Route path="tasks" element={<MemberTaskPage />} />
            <Route path="userinfo" element={<MemberUserInfo />} />
            <Route path="userupdate" element={<MemberUserUpdate />} />
            <Route path="projectlist" element={<MemberProjectList />} />
            <Route path="notice/list" element={<NoticeListPage />} />
            <Route path="notice/:noticeId" element={<NoticeViewPage />} />
          </Route>
          <Route path="member/channel/:project_id" element={
            <PrivateRoute allowedRoles={["R02"]}>
              <ProjectChannel role="R02" />
            </PrivateRoute>
          }>
            <Route path="common" element={<MemberProjectChannel />} />
            <Route path="pm/:user_id" element={<ProjectChannelMemberPage />} />
            <Route path="create/" element={<ProjectChannelPmCreatePage />} />
            <Route path="update/:channel_id" element={<ProjectChannelPmUpdatePage />} />
            <Route path="view/:channel_id" element={<ProjectChannelView/>}/>
          </Route>

          {/* 관리자 */}
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={["R03", "R04"]}>
                <SidebarLayout role="PM(Admin)" />

            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUserManagementPage />} />
          <Route path="projects/all" element={<AdminAllProjectsPage />} />
          <Route path="projects" element={<AdminProjectManagementPage />} />
          <Route path="project/:id" element={<AdminProjectDetailPage />} /> {/* ✅ 추가 */}
          <Route path="notice/create" element={<NoticeCreatePage />} />
          <Route path="notice/list" element={<NoticeListPage />} />
          <Route path="notice/:noticeId" element={<NoticeViewPage />} />
          <Route path="notice/:noticeId/update" element={<NoticeUpdatePage />} />
          <Route path="askList" element={<AdminAskListPage />} />
          <Route path="create" element={<AdminProjectCreatePage />} />
          <Route path="update/:project_id" element={<AdminProjectUpdatePage />} />
          <Route path="portfolioList" element={<AdminPortfolioList />} />
          <Route path="portfolioCreate" element={<AdminPortfolioCreatePage />} />
          <Route path="portfolioUpdate/:portfolio_id" element={<AdminPortfolioUpdatePage />} />

          </Route>
          <Route path="admin/channel/:project_id" element={
            <PrivateRoute allowedRoles={["R03", "R04"]}>
              <ProjectChannel role="R03" />  {/* 위에서 R03이나 R04면 관리자인값 R03넘기는거라 상관없음 */}
            </PrivateRoute>
          }>
            <Route path="create/:user_id" element={<ProjectChannelCreate />} />
            <Route path="common" element={<ProjectChannelCommon />} />
            <Route path="member/:user_id" element={<ProjectChannelMember />} />
            <Route path="update/:channel_id" element={<ProjectChannelUpdate />} />
            <Route path="view/:channel_id" element={<ProjectChannelView/>}/>

          </Route>
          <Route path="admin/channel/:channel_id/update" element={<ProjectChannelUpdate />} />




        </Routes>
      </AlertProvider>
    </Router >
  );
}

export default App;
