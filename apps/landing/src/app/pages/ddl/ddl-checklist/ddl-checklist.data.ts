import type { ChecklistRunBody, ChecklistSectionedContent } from '@portfolio/shared/types';

/**
 * Fixture for /ddl/checklist: `checklist-lane-l.md`, `bang-tra.md` and `projects/portfolio.md` from the
 * workflow folder, run through the API's own parser (`ChecklistMarkdownParser`), so every layout
 * option shows real content. A few rows are preset (done, skipped, one note) to show every state.
 */
export const DDL_CHECKLIST_RUN: ChecklistRunBody = {
  intro: {
    markdown:
      'Vào làn L khi có **một** trong các dấu hiệu: đổi hành vi người dùng đang dựa vào · chạm tiền, quyền, dữ liệu, migration · nhiều hệ thống · khó đảo ngược (tra A).\n\nTiêu đề mỗi pha: **tên pha | role ngoài thực tế thường làm việc này** (để Owner đổi góc nhìn khi vào pha).\n\n**Vai trò** (gọi theo góc nhìn người ngoài):\n**Owner** = người làm chủ ticket (con người) · **Claude** = Claude trong session đang làm việc · **Claude, session mới** = Claude ở context sạch, không thấy quá trình làm ra sản phẩm · **Máy** = test, lint, type check, build · **Người đưa vấn đề** = CS, BA hoặc Manager · **Manager** · **Tester** · **Người nghiệm thu UAT**\n\nDòng in đậm không có ô ✔ là **tên nhóm**; các dòng bắt đầu bằng ↳ ngay dưới nó là việc con của nhóm đó.\nÔ "Ai kiểm" để "—" nghĩa là việc đó **chưa có ai kiểm**, Owner chấp nhận điều đó một cách có chủ ý.\nChỗ cần cách làm thì có chỉ dẫn "tra X" sang `bang-tra.md`. Dấu **📁 §N** nghĩa là dòng đó cần dữ liệu riêng của project: mở mục N trong hồ sơ project (`projects/<project>.md`), dùng cái đã có, ghi thêm cái mới phát hiện.',
    refs: [
      {
        kind: 'lookup',
        key: 'A',
      },
    ],
  },
  phases: [
    {
      id: 'p1',
      number: 1,
      name: 'Problem Discovery',
      role: 'Business Analyst',
      gate: {
        markdown: 'Người đưa vấn đề xác nhận Owner đã hiểu đúng vấn đề.',
        refs: [],
      },
      note: null,
      rows: [
        {
          kind: 'task',
          id: 'r1',
          text: '**Ai dùng, ở bối cảnh nào**: ở đâu, thiết bị gì, tay có rảnh không, mạng có ổn không; một ngày làm việc này bao nhiêu lần · 📁 §1',
          refs: [
            {
              kind: 'project',
              key: '1',
            },
          ],
          doer: 'Owner',
          checker: 'Người đưa vấn đề',
          state: 'done',
          note: '',
        },
        {
          kind: 'task',
          id: 'r2',
          text: '**Hôm nay họ làm thế nào** (kể cả Excel hay gọi điện); cách làm đó lộ ra ràng buộc gì · 📁 §2',
          refs: [
            {
              kind: 'project',
              key: '2',
            },
          ],
          doer: 'Owner',
          checker: 'Người đưa vấn đề',
          state: 'done',
          note: '',
        },
        {
          kind: 'task',
          id: 'r3',
          text: 'Vấn đề trong một câu; bằng chứng; vì sao lúc này',
          refs: [],
          doer: 'Owner',
          checker: 'Người đưa vấn đề',
          state: 'skipped',
          note: '',
        },
        {
          kind: 'task',
          id: 'r4',
          text: '**"Xong" là một câu quan sát được về người dùng**, không phải "màn hình chạy được"',
          refs: [],
          doer: 'Owner',
          checker: 'Người đưa vấn đề',
          state: 'done',
          note: 'Đã chốt với người đưa vấn đề: xong là khi CS tự đóng ticket, không phải gọi team.',
        },
        {
          kind: 'task',
          id: 'r5',
          text: 'Ai bị ảnh hưởng **gián tiếp** (team khác, báo cáo, integration, CS phải trả lời khách); ai có quyền nói "đúng" · 📁 §6, §9',
          refs: [
            {
              kind: 'project',
              key: '6',
            },
            {
              kind: 'project',
              key: '9',
            },
          ],
          doer: 'Owner',
          checker: 'Người đưa vấn đề',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r6',
          text: 'Ngoài phạm vi + danh sách câu hỏi mở: quét danh mục chung (tra G) + câu hỏi hay phải hỏi · 📁 §4',
          refs: [
            {
              kind: 'lookup',
              key: 'G',
            },
            {
              kind: 'project',
              key: '4',
            },
          ],
          doer: 'Owner; Claude gợi ý câu hỏi',
          checker: 'Người đưa vấn đề trả lời câu hỏi mở',
          state: 'todo',
          note: '',
        },
      ],
    },
    {
      id: 'p2',
      number: 2,
      name: 'Solution Design',
      role: 'Solution Architect',
      gate: {
        markdown: 'Manager duyệt design doc.',
        refs: [],
      },
      note: null,
      rows: [
        {
          kind: 'task',
          id: 'r7',
          text: 'Design doc: ít nhất hai phương án, phương án chọn và vì sao, **alternatives considered**',
          refs: [],
          doer: 'Claude soạn; Owner chọn',
          checker: 'Claude, session mới: tìm điểm yếu; Manager duyệt',
          state: 'done',
          note: '',
        },
        {
          kind: 'task',
          id: 'r8',
          text: 'Cross-cutting concerns: bảo mật, dữ liệu, observability · 📁 §5',
          refs: [
            {
              kind: 'project',
              key: '5',
            },
          ],
          doer: 'Owner',
          checker: 'Manager',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r9',
          text: 'Blast radius + tương thích: **trong code** (ai gọi, ai đọc) + **ngoài code** (client cũ, integration, báo cáo và export, cấu hình riêng của khách) · 📁 §6',
          refs: [
            {
              kind: 'project',
              key: '6',
            },
          ],
          doer: 'Claude dò phần trong code; Owner bổ sung phần ngoài code',
          checker: 'Owner',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r10',
          text: 'Dữ liệu: migration chạy thế nào, dữ liệu cũ xử lý ra sao, có đảo ngược được không · 📁 §6',
          refs: [
            {
              kind: 'project',
              key: '6',
            },
          ],
          doer: 'Owner',
          checker: 'Manager',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r11',
          text: 'Chia nhỏ thành các lần release độc lập nếu được',
          refs: [],
          doer: 'Owner',
          checker: 'Manager',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r12',
          text: 'Rabbit hole đã chặn + appetite (vượt thì cắt scope)',
          refs: [],
          doer: 'Owner',
          checker: 'Manager',
          state: 'todo',
          note: '',
        },
      ],
    },
    {
      id: 'p3',
      number: 3,
      name: 'Acceptance & Test Design',
      role: 'Business Analyst + Tester',
      gate: {
        markdown: 'Không còn thẻ câu hỏi nào chặn việc build.',
        refs: [],
      },
      note: null,
      rows: [
        {
          kind: 'group',
          id: 'r13',
          text: 'Example mapping',
          refs: [],
          note: '',
          children: [
            {
              kind: 'task',
              id: 'r14',
              text: 'Viết quy tắc; mỗi quy tắc ít nhất một ví dụ cụ thể (có số, có tên, có tình huống); chỗ không viết được ví dụ thì thành thẻ câu hỏi',
              refs: [],
              doer: 'Owner',
              checker: 'Claude, session mới: tìm quy tắc thiếu, ví dụ mâu thuẫn',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r15',
              text: '**Ít nhất ba trường hợp biên**: quét danh sách chung (tra F) + danh sách riêng · 📁 §3',
              refs: [
                {
                  kind: 'lookup',
                  key: 'F',
                },
                {
                  kind: 'project',
                  key: '3',
                },
              ],
              doer: 'Claude soạn',
              checker: 'Owner',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r16',
              text: '**Đọc bản map**: nhiều câu hỏi → chưa build · nhiều quy tắc → chia nhỏ, quay lại pha 2 · một quy tắc kéo nhiều ví dụ → đi chậm ở đó',
              refs: [],
              doer: 'Owner',
              checker: '—',
              state: 'todo',
              note: '',
            },
          ],
        },
        {
          kind: 'task',
          id: 'r17',
          text: 'NFR **bắt buộc xét** performance, phân quyền, bảo mật input; các NFR khác chọn cái áp dụng (tra C) · 📁 §5',
          refs: [
            {
              kind: 'lookup',
              key: 'C',
            },
            {
              kind: 'project',
              key: '5',
            },
          ],
          doer: 'Owner',
          checker: '—',
          state: 'todo',
          note: '',
        },
        {
          kind: 'group',
          id: 'r18',
          text: 'Từ quy tắc ra test',
          refs: [],
          note: '',
          children: [
            {
              kind: 'task',
              id: 'r19',
              text: 'Quy tắc → AC dạng `WHEN … THE SYSTEM SHALL …`, mỗi AC có ID',
              refs: [],
              doer: 'Claude soạn',
              checker: 'Owner',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r20',
              text: 'Ba câu hỏi, kỹ thuật, test level cho từng luật (tra B) · 📁 §7',
              refs: [
                {
                  kind: 'lookup',
                  key: 'B',
                },
                {
                  kind: 'project',
                  key: '7',
                },
              ],
              doer: 'Claude soạn nháp',
              checker: 'Owner',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r21',
              text: 'Sửa tính năng đang chạy: test hành vi cũ cần giữ **trước** khi sửa',
              refs: [],
              doer: 'Claude',
              checker: 'Owner',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r22',
              text: 'Logic chạm tiền hoặc quyền: kiểm chính bộ test bằng mutation testing · 📁 §7',
              refs: [
                {
                  kind: 'project',
                  key: '7',
                },
              ],
              doer: 'Máy (mutation tool)',
              checker: 'Owner đọc mutation score',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r23',
              text: 'Ví dụ → test case, viết **trước** code, ở session riêng, test ghi ID của AC; **expected lấy từ ví dụ, không đọc từ code** (tra H)',
              refs: [
                {
                  kind: 'lookup',
                  key: 'H',
                },
              ],
              doer: 'Claude',
              checker: 'Owner',
              state: 'todo',
              note: '',
            },
          ],
        },
      ],
    },
    {
      id: 'p4',
      number: 4,
      name: 'Prototype',
      role: 'UI/UX Designer',
      gate: {
        markdown: 'Manager đồng ý với mockup hoặc demo.',
        refs: [],
      },
      note: null,
      rows: [
        {
          kind: 'task',
          id: 'r24',
          text: 'Design system đủ thì tự làm, không đủ thì gọi designer · 📁 §7',
          refs: [
            {
              kind: 'project',
              key: '7',
            },
          ],
          doer: 'Owner',
          checker: '—',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r25',
          text: 'Mockup hoặc demo bấm được; present; ghi feedback',
          refs: [],
          doer: 'Owner',
          checker: 'Manager',
          state: 'todo',
          note: '',
        },
      ],
    },
    {
      id: 'p5',
      number: 5,
      name: 'Implementation',
      role: 'Developer',
      gate: {
        markdown: 'Máy báo mọi check xanh.',
        refs: [],
      },
      note: null,
      rows: [
        {
          kind: 'task',
          id: 'r26',
          text: 'Session mới, chỉ đọc spec + test; test của pha 3 không được sửa',
          refs: [],
          doer: 'Claude, session mới',
          checker: 'Owner',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r27',
          text: 'Type check, lint, test, build · 📁 §7',
          refs: [
            {
              kind: 'project',
              key: '7',
            },
          ],
          doer: 'Máy',
          checker: 'Owner xem output',
          state: 'todo',
          note: '',
        },
      ],
    },
    {
      id: 'p6',
      number: 6,
      name: 'Testing',
      role: 'Tester',
      gate: {
        markdown: 'Owner xác nhận không còn bug **đã biết** trong phạm vi.',
        refs: [],
      },
      note: null,
      rows: [
        {
          kind: 'task',
          id: 'r28',
          text: 'Mỗi test mới đã từng **đỏ** ít nhất một lần',
          refs: [],
          doer: 'Claude',
          checker: 'Owner xem output',
          state: 'todo',
          note: '',
        },
        {
          kind: 'group',
          id: 'r29',
          text: 'Đọc và review diff',
          refs: [],
          note: '',
          children: [
            {
              kind: 'task',
              id: 'r30',
              text: 'Đọc diff **nguội**: **giải thích được từng dòng**, không giải thích được thì chưa merge; tìm thứ không liên quan tới task (tra D)',
              refs: [
                {
                  kind: 'lookup',
                  key: 'D',
                },
              ],
              doer: 'Owner',
              checker: '—',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r31',
              text: 'Review diff so với AC, chỉ lấy finding về correctness và thứ ngoài phạm vi task',
              refs: [],
              doer: 'Claude, session mới',
              checker: 'Owner lọc finding',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r32',
              text: 'Review chuyên môn (bảo mật hoặc performance) · 📁 §5',
              refs: [
                {
                  kind: 'project',
                  key: '5',
                },
              ],
              doer: 'Claude, session mới',
              checker: 'Owner lọc finding',
              state: 'todo',
              note: '',
            },
          ],
        },
        {
          kind: 'task',
          id: 'r33',
          text: 'Migration chạy thử trên bản sao dữ liệu giống thật · 📁 §6',
          refs: [
            {
              kind: 'project',
              key: '6',
            },
          ],
          doer: 'Owner',
          checker: 'Máy (so dữ liệu trước và sau)',
          state: 'todo',
          note: '',
        },
        {
          kind: 'group',
          id: 'r34',
          text: '**Tự kiểm 4 lớp trên app thật**, theo thứ tự; lớp trước hỏng thì chưa sang lớp sau',
          refs: [],
          note: '',
          children: [
            {
              kind: 'task',
              id: 'r35',
              text: '**Lớp 1 · Đường hạnh phúc**: chạy đúng kịch bản chính bằng tay, như người dùng thật, theo các ví dụ của pha 3. Không phải "unit test pass"',
              refs: [],
              doer: 'Owner',
              checker: '—',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r36',
              text: '**Lớp 2 · Biên**: chạy 3 biên của pha 3; xem màn hình lỗi, rỗng, đang tải khi thứ này fail',
              refs: [],
              doer: 'Owner',
              checker: '—',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r37',
              text: '**Lớp 3 · Hồi quy quanh chỗ sửa**: mở thử ít nhất một chỗ dùng chung hàm, component, endpoint này (từ blast radius ở pha 2) · 📁 §6',
              refs: [
                {
                  kind: 'project',
                  key: '6',
                },
              ],
              doer: 'Claude dò (grep, git log); Owner mở thử',
              checker: '—',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r38',
              text: '**Lớp 4 · Dữ liệu thật**: thử với dữ liệu cũ, bẩn, thiếu field, sai format; không phải seed sạch · 📁 §3, §6',
              refs: [
                {
                  kind: 'project',
                  key: '3',
                },
                {
                  kind: 'project',
                  key: '6',
                },
              ],
              doer: 'Owner',
              checker: '—',
              state: 'todo',
              note: '',
            },
          ],
        },
        {
          kind: 'task',
          id: 'r39',
          text: '30 phút exploratory có charter: "Khám phá ‹vùng› với ‹cách / dữ liệu› để tìm ‹loại vấn đề›"; ghi lại bug, câu hỏi, ý tưởng',
          refs: [],
          doer: 'Owner',
          checker: '—',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r40',
          text: 'Kiểm các NFR đã chọn ở pha 3 · 📁 §5',
          refs: [
            {
              kind: 'project',
              key: '5',
            },
          ],
          doer: 'Owner',
          checker: '—',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r41',
          text: 'Ghi chú bàn giao: đổi gì, test ở đâu, rủi ro ở đâu · 📁 §9',
          refs: [
            {
              kind: 'project',
              key: '9',
            },
          ],
          doer: 'Owner',
          checker: 'Tester (nếu có)',
          state: 'todo',
          note: '',
        },
      ],
    },
    {
      id: 'p7',
      number: 7,
      name: 'Release',
      role: 'Release Manager',
      gate: {
        markdown: 'Người nghiệm thu UAT ký nhận.',
        refs: [],
      },
      note: null,
      rows: [
        {
          kind: 'group',
          id: 'r42',
          text: 'Chuẩn bị trước khi release',
          refs: [],
          note: '',
          children: [
            {
              kind: 'task',
              id: 'r43',
              text: 'Rollback (cách làm, ai làm, feature flag) viết **trước**; migration, config, env từng môi trường · 📁 §8',
              refs: [
                {
                  kind: 'project',
                  key: '8',
                },
              ],
              doer: 'Owner',
              checker: 'Manager',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r44',
              text: '**Diễn tập rollback** ít nhất một lần ở SIT hoặc UAT · 📁 §8',
              refs: [
                {
                  kind: 'project',
                  key: '8',
                },
              ],
              doer: 'Owner',
              checker: 'Máy (smoke test sau rollback)',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r45',
              text: 'Chốt trước: theo dõi chỉ số nào, ngưỡng nào thì rollback · 📁 §8',
              refs: [
                {
                  kind: 'project',
                  key: '8',
                },
              ],
              doer: 'Owner',
              checker: 'Manager',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r46',
              text: 'Báo trước cho CS và người bị ảnh hưởng: đổi gì, khi nào, hỏi ai · 📁 §9',
              refs: [
                {
                  kind: 'project',
                  key: '9',
                },
              ],
              doer: 'Owner',
              checker: 'Người đưa vấn đề',
              state: 'todo',
              note: '',
            },
          ],
        },
        {
          kind: 'group',
          id: 'r47',
          text: 'Đưa lên từng bước',
          refs: [],
          note: '',
          children: [
            {
              kind: 'task',
              id: 'r48',
              text: 'SIT → UAT → PROD, smoke test sau mỗi bước · 📁 §8',
              refs: [
                {
                  kind: 'project',
                  key: '8',
                },
              ],
              doer: 'Owner',
              checker: 'Người nghiệm thu UAT',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r49',
              text: 'Rollout từng phần ở PROD: feature flag → nội bộ → một nhóm nhỏ → toàn bộ · 📁 §8',
              refs: [
                {
                  kind: 'project',
                  key: '8',
                },
              ],
              doer: 'Owner',
              checker: 'Máy (chỉ số đã chốt)',
              state: 'todo',
              note: '',
            },
          ],
        },
      ],
    },
    {
      id: 'p8',
      number: 8,
      name: 'Post-release Review',
      role: 'Product Manager',
      gate: {
        markdown: 'Owner đã so thước đo ở pha 1 với kết quả thật.',
        refs: [],
      },
      note: null,
      rows: [
        {
          kind: 'task',
          id: 'r50',
          text: 'Theo dõi lỗi, log và các chỉ số đã chốt ở pha 7, lâu hơn làn M; báo lại kết quả · 📁 §8',
          refs: [
            {
              kind: 'project',
              key: '8',
            },
          ],
          doer: 'Owner',
          checker: 'Người đưa vấn đề',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r51',
          text: 'Xem lại thước đo ở pha 1 sau một mốc thời gian cố định',
          refs: [],
          doer: 'Owner',
          checker: 'Người đưa vấn đề',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r52',
          text: 'As-built doc, gỡ flag, một dòng bài học → sửa checklist · 📁 §10',
          refs: [
            {
              kind: 'project',
              key: '10',
            },
          ],
          doer: 'Claude soạn as-built doc',
          checker: 'Owner',
          state: 'todo',
          note: '',
        },
      ],
    },
  ],
  footer: {
    markdown: '**Gặp bug ở bất kỳ pha nào:** tra E.',
    refs: [
      {
        kind: 'lookup',
        key: 'E',
      },
    ],
  },
};

export const DDL_CHECKLIST_LOOKUP: ChecklistSectionedContent = {
  intro: 'Chỉ mở khi checklist chỉ tới. Không đọc từ đầu tới cuối.',
  sections: [
    {
      key: 'A',
      title: 'Chọn làn',
      markdown:
        'Làn chọn theo **rủi ro**, không theo "tính năng mới hay sửa cũ".\n\n| Làn | Dấu hiệu | Pha chạy |\n| --- | --- | --- |\n| **L** | Có **một** trong: đổi hành vi người dùng đang dựa vào · chạm tiền, quyền, dữ liệu, migration · nhiều hệ thống · khó đảo ngược | Đủ 8 pha, pha 2 có design doc |\n| **S** | Rõ nguyên nhân, chạm một chỗ, đảo ngược dễ | 1 (một câu) → 5 → 6 → 7 |\n| **M** | Còn lại | Đủ 8 pha, bản rút gọn |\n\n**Nâng làn** ngay khi đang làm mà gặp dấu hiệu của làn cao hơn. Không bao giờ hạ làn giữa chừng để kịp giờ.',
    },
    {
      key: 'B',
      title: 'Ba câu hỏi, kỹ thuật, test level',
      markdown:
        '**Ba câu hỏi cho từng luật**\n\n1. Sai ở đâu thì đắt? → dồn test vào đó. Gán field, hành vi của framework thì không test.\n2. "Đúng" lấy từ đâu? → từ luật và AC, **không** từ code.\n3. Bao nhiêu là đủ? → chọn kỹ thuật bên dưới, đếm coverage item.\n\n**Chọn kỹ thuật theo hình dạng input**\n\n| Hình dạng | Kỹ thuật | Ai làm |\n| --- | --- | --- |\n| Khoảng giá trị | EP + BVA | Claude sinh, Owner kiểm biên |\n| Nhiều điều kiện đan nhau trong cùng một luật | Decision table | Claude dựng, Owner thẩm định: thiếu/thừa điều kiện, tổng cột, N/A có lý do |\n| Nhiều tham số độc lập (trình duyệt × ngôn ngữ × vai trò) | Pairwise | Tool (PICT) |\n| Có trạng thái và chuyển trạng thái | State transition | Claude vẽ, Owner kiểm chuyển không hợp lệ |\n| Luồng nhiều bước | Scenario test theo đường đi | Owner chọn đường đi |\n| Có quy luật bất biến | Property-based | Claude viết, Owner duyệt quy luật |\n\n**Test level**\n\n- Logic trong một hàm hoặc một class → unit\n- **Chỗ ghép nối** giữa hai module, hoặc với DB hay dịch vụ ngoài → integration (unit không bắt được)\n- Luồng người dùng quan trọng nhất → E2E, ít thôi',
    },
    {
      key: 'C',
      title: 'NFR',
      markdown:
        'Chỉ chọn cái áp dụng: performance · phân quyền · bảo mật input · mobile · accessibility · log/monitoring',
    },
    {
      key: 'D',
      title: 'Đọc diff',
      markdown:
        '- Đọc **nguội**, như thể người khác viết: sau một khoảng nghỉ, tốt nhất là hôm sau. Diff cho thấy cái **đã đổi**, không phải cái Owner **tưởng** mình đã đổi; khi AI viết code, hai thứ này lệch nhau nhiều hơn người ta nghĩ\n- Mỗi dòng phải giải thích được. Dòng nào không giải thích được thì chưa merge\n- Tìm thứ **không liên quan tới task**: file lạc vào, import thừa, format đổi cả file, "cải tiến" AI tự thêm. Đây là nguồn lỗi âm thầm lớn nhất khi dùng AI nhiều\n- Đọc lần lượt theo từng góc nhìn: **người dùng**, **người vận hành**, **kẻ tấn công**\n- Test bám **hành vi**, không bám implementation (refactor mà test đỏ là dấu hiệu bám implementation)\n- Coverage chỉ dùng để tìm chỗ chưa test, **không** dùng làm cổng\n- Reviewer AI luôn tìm ra gì đó: chỉ nhận finding ảnh hưởng correctness hoặc AC',
    },
    {
      key: 'E',
      title: 'Khi gặp bug',
      markdown:
        '1. Chốt **severity** (hỏng nặng cỡ nào) và **priority** (gấp cỡ nào) → sửa ngay, hoặc mở ticket **có hạn**. Không để dồn trong backlog.\n2. Ghi repro steps; tái hiện bằng một test **đỏ** trước khi sửa (debugging).\n3. Sửa → test đó xanh (confirmation testing) → chạy lại bộ test liên quan (regression testing).\n4. Ghi **một dòng: lỗi gì, tại sao lọt** vào run log của ticket. "Tại sao lọt" trỏ tới **pha và dòng** của checklist (ở pha 6 thì tới lớp 1–4), vì bug có thể lọt ở bất kỳ pha nào: hiểu sai vấn đề, thiếu quy tắc, expected chép từ code, không đọc diff, môi trường release. Sau vài tháng, các dòng này là khuôn mẫu lỗi của chính Owner. Nếu là lỗ hổng của quy trình thì sửa checklist.\n5. Bug hay tụ cụm: soi thêm vùng code quanh chỗ vừa sửa.',
    },
    {
      key: 'F',
      title: 'Danh sách quét trường hợp biên (chung cho mọi project)',
      markdown:
        'Mỗi lần nêu **ít nhất ba**. Đây là biên của **tình huống**; biên của **giá trị** (số, độ dài) thì dùng EP + BVA ở mục B. Biên riêng của từng project nằm trong hồ sơ project ở `projects/`.\n\n- Rỗng (chưa có dữ liệu nào)\n- Rất nhiều (danh sách dài, file lớn)\n- Hai người cùng sửa một thứ\n- Mất mạng giữa chừng\n- Dữ liệu lịch sử sai định dạng\n- Hệ thống bên ngoài chậm hoặc lỗi',
    },
    {
      key: 'G',
      title: 'Danh mục câu hỏi (pha 1)',
      markdown:
        '**Cách dùng:** đọc lướt một lượt, đánh dấu câu nào Owner **không trả lời được**. Những câu đó là câu hỏi mở. Thường chỉ 3–4 câu sáng lên; đừng hỏi hết. Câu hỏi riêng của project nằm ở hồ sơ project §4.\n\n1. **Người và bối cảnh.** Ai bấm vào đây? Lúc đó họ đang ở đâu, tay có rảnh không, mạng thế nào? Một ngày họ làm việc này 1 lần hay 50 lần?\n2. **Dữ liệu từ đâu.** Nhập tay, import, integration, hay hệ thống tự tính? Trường nào bắt buộc, và ai là người quyết định điều đó? Dữ liệu lịch sử có đúng định dạng này không?\n3. **Ai được làm gì.** Ai xem được, ai sửa được? Sửa sau khi việc đã đóng thì sao? Có cần dấu vết ai sửa gì không? Tính năng này có trên gói nào?\n4. **Trạng thái và thời gian.** Có bao nhiêu trạng thái, và đi ngược được không? Cái gì tự động, cái gì cần người bấm? Quá hạn thì sao, hủy giữa đường thì sao? *(Nhóm này sáng lên → dùng state transition ở tra B.)*\n5. **Cái gì vỡ.** Quét danh sách ở tra F.\n6. **Tiền.** Cái này có chạm vào hóa đơn không? Nếu đã đẩy sang kế toán rồi mà sửa thì sao? Ai chịu hậu quả nếu số sai: khách, người làm, hay công ty? *(Nhóm này sáng lên → nâng lên làn L.)*',
    },
    {
      key: 'H',
      title: 'Tự động hay làm tay',
      markdown:
        'Danh sách test case là của **Owner**, không phải của Claude. Nguồn của nó là ví dụ và biên ở pha 3: biên nghĩ ra lúc đặc tả chính là test case lúc kiểm.\n\n| Loại | Cách kiểm | Lưu ý |\n| --- | --- | --- |\n| Logic thuần: hàm tính toán, transform dữ liệu, quy tắc validation (input/output rõ ràng) | Claude viết **code của test** | **Expected lấy từ quy tắc và ví dụ của pha 3, không đọc từ code.** Test lấy expected từ code thì sai cùng với code mà vẫn xanh (test oracle problem, "reverse TDD") |\n| Luồng người dùng, cái thật sự hiện trên màn hình, hiệu năng cảm nhận được | Owner làm tay (tự kiểm 4 lớp ở pha 6) | Claude không biết người dùng đang đứng ở đâu, tay có rảnh không (📁 §1) |\n| Chỗ ghép nối nhiều hệ (module với module, app với DB hay dịch vụ ngoài) | Làm tay lần đầu, rồi viết **integration test** tự động | Unit test không bắt được lỗi ở chỗ ghép nối |\n| Đường chính quan trọng nhất | Làm tay lần đầu, rồi viết **E2E** | Để khỏi phải kiểm tay lại mỗi lần release; giữ số E2E ít |',
    },
  ],
};

export const DDL_CHECKLIST_PROJECT: ChecklistSectionedContent = {
  intro:
    'File này chứa **dữ liệu riêng** của một project: những câu trả lời đã biết. Luật chung nằm ở checklist và `bang-tra.md`, không chép lại ở đây.\nChecklist trỏ tới đây bằng dấu **📁 §N**. Lớn dần theo ticket: phát hiện điều mới thì ghi thêm một dòng. Điều gì gặp lại ở project thứ hai thì đưa lên file evergreen.\n\nDùng cho 3 tuần chạy thử workflow. Owner đóng luôn vai người đưa vấn đề, Manager và người nghiệm thu UAT.',
  sections: [
    {
      key: '1',
      title: 'Người dùng và bối cảnh sử dụng',
      markdown:
        '| Ai | Ở đâu, thiết bị gì | Tay có rảnh không, mạng có ổn không | Hệ quả cho thiết kế |\n| --- | --- | --- | --- |\n| Người xem landing (recruiter, đồng nghiệp) | Desktop và điện thoại, 4 breakpoint | Thường lướt nhanh | Đọc được ở mobile; SSR để tải nhanh |\n| Owner, tác giả nội dung | Console trên desktop | Ổn định | Form, rich-text editor |',
    },
    {
      key: '2',
      title: 'Hôm nay họ làm thế nào',
      markdown: 'Cách làm hiện tại (kể cả Excel, gọi điện) và ràng buộc nó lộ ra.',
    },
    {
      key: '3',
      title: 'Danh sách biên riêng',
      markdown:
        '- Hai ngôn ngữ EN / VI: chuỗi thiếu một bên, chuỗi tiếng Việt dài hơn\n- SSR và hydration: nội dung khác nhau giữa server và client\n- Dữ liệu prod là nguồn thật, seed local không phản ánh đủ',
    },
    {
      key: '4',
      title: 'Câu hỏi hay phải hỏi (và ai trả lời)',
      markdown:
        'Câu hỏi mà gần như ticket nào cũng phải hỏi, kèm người trả lời được. Chỉ giữ câu có câu trả lời **đổi theo từng ticket**; câu nào đã có câu trả lời ổn định thì chuyển câu trả lời sang mục tương ứng và xóa câu hỏi ở đây.',
    },
    {
      key: '5',
      title: 'NFR mặc định và ràng buộc',
      markdown:
        '- Responsive theo 4 breakpoint (mobile, tablet, laptop, wide)\n- Chuỗi hiển thị trên landing đi qua dictionary EN / VI',
    },
    {
      key: '6',
      title: 'Phụ thuộc mà code không cho thấy',
      markdown:
        '- Ảnh nằm trên Cloudinary: URL và transform đã phát hành không được đổi tùy tiện\n- Dữ liệu prod là nguồn thật của nội dung; seed local chỉ là bản nháp\n- Link đã chia sẻ ra ngoài (slug blog, slug project, ảnh OG trên mạng xã hội) phải tiếp tục chạy\n- Umami analytics và Railway là dịch vụ bên ngoài, đổi cấu hình là ảnh hưởng chi phí',
    },
    {
      key: '7',
      title: 'Cách làm kỹ thuật',
      markdown:
        'Lệnh và quy ước ở `.context/commands.md`, `.context/testing-guide.md`. Design system: `/ddl` cho landing, Angular Material + `ui-*` cho console.',
    },
    {
      key: '8',
      title: 'Môi trường, release, rollback, monitoring',
      markdown:
        'Local → production trên Railway. Không có SIT / UAT riêng: coi bản build production chạy local là SIT, chính Owner nghiệm thu.',
    },
    {
      key: '9',
      title: 'Người liên quan và từ vựng domain',
      markdown: '| Ai | Vai trò trong workflow |\n| --- | --- |\n| Owner | Tất cả các vai |',
    },
    {
      key: '10',
      title: 'Tài liệu nằm ở đâu',
      markdown: '`.context/` trong repo: `decisions.md` (ADR), `tasks/`, `plans/`.',
    },
  ],
};
