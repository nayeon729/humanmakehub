import { Outlet, Link, useParams, useLocation } from "react-router-dom";
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Divider, Stack } from "@mui/material";
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ProjectChannel({ role }) {
  const location = useLocation();
  const { project_id } = useParams();
  const [members, setMembers] = useState([]);
  const [pmId, setPmId] = useState(null);
  const [menus, setMenus] = useState([]);
  const [myUserId, setMyUserId] = useState("");
  const [teamMemberId, setTeamMemberId] = useState("");
  const [alertsCount, setAlertCount] = useState("");
  const [isChecked, setIsChecked] = useState(false);

  const BASE_URL = "http://127.0.0.1:8000";

  // 🔑 현재 로그인된 user_id 가져오기
  useEffect(() => {
    const id = localStorage.getItem("user_id");
    if (id) {
      setMyUserId(id);
    }
  }, []);

  useEffect(() => {
    const getTeamMemberId = async () => {
    if(myUserId != "" && project_id != null){
        try {
        const res = await axios.get(`${BASE_URL}/common/teamMemberId/${project_id}/${myUserId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        console.log("res : ", res);
        console.log("project_id" , project_id);
        console.log("userId", myUserId);
        console.log("res.data.team_memeber_id", res.data.team_member_id);
        console.log("type", typeof(res.data.team_member_id));
        setTeamMemberId(res.data.team_member_id);
        setPmId(res.data.pm_id);
      } catch (err) {
        console.error("프로젝트 팀멤버아이디 조회 실패", err);
      }
      }
    }
    getTeamMemberId();
  },[project_id, myUserId])

  useEffect(() => {
    if (isChecked) {
      getalertCount();     // 개발자용 알림갯수 다시 불러와서세팅
      adminGetAlertCount();// 관리자용 알림갯수 다시 불러와서세팅
      setIsChecked(false); // 초기화
    }
  }, [isChecked]);

  useEffect(() => {
    getalertCount();
  },[teamMemberId, pmId])

  const getalertCount = async () => {

    if(myUserId != "" && role != "R03"){
        try {
          const res = await axios.get(`${BASE_URL}/common/alerts/${teamMemberId}/${pmId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          console.log("1대1 알림 갯수 : ", res.data.count);
          setAlertCount(res.data.count);
        } catch (err) {
          console.error("알림 갯수 조회 실패", err);
        }
      } else {
        console.log("PM입니다.");
      }
  }

  // 🔧 메뉴 경로 설정
  useEffect(() => {
    const base = `/member/channel/${project_id}`;
    if (role === "R02" && myUserId) {
      setMenus([
        { text: "공용", path: `${base}/common` },
        { text: "PM", path: `${base}/pm/${myUserId}` }, // ✅ user_id 포함!
      ]);
    } else if (role === "R03") {
      setMenus([{ text: "공용", path: `/admin/channel/${project_id}/common` }]);
    }
  }, [project_id, role, myUserId]);

  // 🔁 관리자일 때 팀원 목록 조회
  useEffect(() => {
    adminGetAlertCount();
  }, [project_id, role]);

  const adminGetAlertCount = () => {
    if (role === "R03") { //관리자면 실행
      axios
        .get(`${BASE_URL}/admin/project/${project_id}/members`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then((res) => {
          setMembers(res.data.members ?? []);
          setPmId(res.data.pm_id);
        })
        .catch((err) => {
          console.error("팀원 불러오기 실패", err);
        });
    } else {
      console.log("PM이 아닙니다.")
    }
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* 사이드바 */}
      <Box sx={{ width: 200, bgcolor: "#f5f5f5", p: 2, boxShadow: 2 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          PROJECT<br />CHANNEL
        </Typography>
        <List>
          {menus.map((item, index) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    backgroundColor: isActive ? "#D9D9D9" : "transparent",
                    fontWeight: isActive ? "bold" : "normal",
                    width: "100%",
                    display: "flex", // 👉 직접 flex 적용
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <ListItemText primary={item.text} sx={{ pl: 1, width: "75%", }}/>
                  <Typography>{item.text == "PM" ? alertsCount || "" : ""}</Typography>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* 🔍 관리자용 팀원 목록 */}
        {role === "R03" && members.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
              팀원 목록
            </Typography>
            <List>
              {members
                .filter((member) => member.user_id !== pmId) // PM 제외
                .map((member) => {
                  const memberPath = `/admin/channel/${project_id}/member/${member.user_id}`;
                  const isActive = location.pathname === memberPath;
                  return (
                    <ListItem key={member.user_id} disablePadding>
                        <ListItemButton
                          component={Link}
                          to={memberPath}
                          sx={{
                            backgroundColor: isActive ? "#D9D9D9" : "transparent",
                            fontWeight: isActive ? "bold" : "normal",
                            width: "100%",
                            display: "flex", // 👉 직접 flex 적용
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <ListItemText primary={member.nickname} sx={{ pl: 1, width: "75%", }} />
                          <Typography> {member.count > 0 ? member.count : ""}</Typography>
                        </ListItemButton>
                    </ListItem>
                  );
                })}
            </List>
          </>
        )}
      </Box>

      {/* 본문 */}
      <Box sx={{ flexGrow: 1, p: 4 }}>
        <Outlet context={{ setIsChecked }}/>
      </Box>
    </Box>
  );
}
