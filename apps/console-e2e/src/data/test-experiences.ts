export const TEST_EXP_PREFIX = 'e2e-exp-';

export const TEST_EXPERIENCES = {
  create: {
    companyName: `${TEST_EXP_PREFIX}create-corp`,
    positionEn: 'Software Engineer',
    positionVi: 'Kỹ sư phần mềm',
    startDate: '01/01/2022',
  },
  createOptional: {
    companyName: `${TEST_EXP_PREFIX}optional-corp`,
    positionEn: 'Full Stack Developer',
    positionVi: 'Lập trình viên Full Stack',
    startDate: '03/01/2021',
    descriptionEn: 'Built great products.',
    descriptionVi: 'Xây dựng sản phẩm tuyệt vời.',
    teamRoleEn: 'Tech Lead',
    teamRoleVi: 'Trưởng nhóm kỹ thuật',
    achievementEn: 'Improved performance by 30%',
    achievementVi: 'Cải thiện hiệu suất 30%',
  },
  edit: {
    companyName: `${TEST_EXP_PREFIX}edit-corp`,
    positionEn: 'Junior Developer',
    positionVi: 'Lập trình viên',
    startDate: '06/01/2020',
    updatedPositionEn: 'Senior Developer',
    updatedPositionVi: 'Lập trình viên cao cấp',
  },
  delete: {
    companyName: `${TEST_EXP_PREFIX}delete-corp`,
    positionEn: 'DevOps Engineer',
    positionVi: 'Kỹ sư DevOps',
    startDate: '01/01/2021',
  },
  restore: {
    companyName: `${TEST_EXP_PREFIX}restore-corp`,
    positionEn: 'Backend Developer',
    positionVi: 'Lập trình viên Backend',
    startDate: '06/01/2019',
  },
  current: {
    companyName: `${TEST_EXP_PREFIX}current-corp`,
    positionEn: 'Frontend Engineer',
    positionVi: 'Kỹ sư Frontend',
    startDate: '01/01/2023',
  },
  skills: {
    companyName: `${TEST_EXP_PREFIX}skills-corp`,
    positionEn: 'Platform Engineer',
    positionVi: 'Kỹ sư nền tảng',
    startDate: '01/01/2022',
  },
  slug1: {
    companyName: `${TEST_EXP_PREFIX}slug-corp`,
    positionEn: 'Engineer',
    positionVi: 'Kỹ sư',
    startDate: '01/01/2020',
  },
  slug2: {
    companyName: `${TEST_EXP_PREFIX}slug-corp`,
    positionEn: 'Engineer',
    positionVi: 'Kỹ sư',
    startDate: '06/01/2020',
  },
} as const;
