// // ClientProjectCreatePage.js
// import React, { useState } from "react";
// import { Box, Typography } from "@mui/material";
// import Combo from "../components/Combo";  // Combo 컴포넌트 경로 맞게 수정!

// export default function ClientProjectCreatePage() {
//   const [projectType, setProjectType] = useState("");

//   return (
//     <Box sx={{ p: 4 }}>
//       <Typography variant="h6" mb={2}>
//         프로젝트 등록
//       </Typography>

//       <Box mb={3}>
//         <Typography variant="subtitle1" gutterBottom>
//           📂 프로젝트 유형 선택
//         </Typography>
//         <Combo
//           groupId="PROJECT_TYPE"                      // ✅ 이게 핵심!
//           defaultValue=""
//           onSelectionChange={(val) => setProjectType(val)}
//           sx={{ minWidth: 300 }}
//         />
//       </Box>

//       <Typography>선택된 유형: {projectType || "없음"}</Typography>
//     </Box>
//   );
// }
