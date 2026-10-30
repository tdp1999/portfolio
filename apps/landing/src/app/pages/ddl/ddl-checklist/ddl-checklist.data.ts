import type { ChecklistRunBody, ChecklistSectionedContent } from '@portfolio/shared/types';

/**
 * Fixture for /ddl/checklist: `lanes/size-l.md` and `lookup.md` from the checklist folder of the
 * ctx plugin (format 2), run through the API's own parser (`ChecklistMarkdownParser`), so every
 * layout option shows real content. A few rows of phase 1 are preset (done, skipped, one note) to
 * show every state.
 */
export const DDL_CHECKLIST_RUN: ChecklistRunBody = {
  intro: {
    markdown:
      'Một ticket là size L khi có một trong các dấu hiệu sau:\n\n- Ticket đổi hành vi mà người dùng đang dựa vào.\n- Ticket chạm tiền, quyền, dữ liệu hoặc migration.\n- Ticket đi qua nhiều hệ thống.\n- Ticket khó đảo ngược.\n\nCách chọn size ở tra A. Ghi dòng "Size: L · vì …" ngay dưới tiêu đề epic.\n\nTiêu đề mỗi phase có dạng "tên phase | role ngoài thực tế thường làm việc này". Role giúp Owner đổi góc nhìn khi vào phase.\n\nDòng "Đầu ra" nói phase đó để lại gì, và ghi vào file nào. Mã E1 đến E7 là các phần của epic. Mỗi mã thuộc đúng một phase. E0 là bảng câu hỏi của epic, dùng ở mọi phase. T1 đến T6 là các phần của task, theo template của plugin ctx.\n\nVai trò (gọi theo góc nhìn người ngoài):\n\n- Owner: người làm chủ ticket (con người).\n- Claude: Claude trong session đang làm việc.\n- Claude, session mới: Claude ở context sạch, không thấy quá trình làm ra sản phẩm.\n- Codex: một model khác (ChatGPT qua plugin codex), context sạch, chỉ nhận context packet.\n- Máy: test, lint, type check, build.\n- Người đưa vấn đề: CS, BA hoặc Manager.\n- Manager, Tester, Người nghiệm thu UAT.\n\nDòng "Ai làm" dùng một trong các mẫu sau:\n\n- Claude soạn; Owner chốt: Claude làm bản nháp, Owner quyết.\n- Owner trước; Claude kiểm tra: Owner tự nghĩ trước, vì chỗ này dễ bị anchoring.\n- Owner: chỉ Owner làm được, ví dụ nói chuyện với người khác, thử app bằng tay, duyệt.\n- Máy: test, lint, build.\n\n"⚙ review" nghĩa là Claude ở session mới và Codex review độc lập, rồi Owner lọc finding. Cách làm ở tra I.\n\n"⚙ review-round" nghĩa là sau khi Claude sinh xong code hoặc test, một subagent và Codex review song song theo skill `review-round`. Claude kiểm tra và sửa các finding. Owner chỉ chốt các quyết định ở mức sản phẩm. Cách làm ở tra K.\n\nCách đọc một item:\n\n- Mỗi item có SN, title, một câu description, rồi content dạng list.\n- Item không có dòng "Ai làm" là tên nhóm. Các item con của nhóm nằm ngay dưới nó.\n- Dòng "Claude:" nghĩa là Claude có hướng dẫn riêng cho item này trong playbook. Owner không cần đọc playbook.\n- "Ai kiểm: —" nghĩa là việc đó chưa có ai kiểm, và Owner chấp nhận điều đó một cách có chủ ý.\n- "tra X" chỉ sang mục X của `lookup.md`, nơi có cách làm.\n- "📁 §N" nghĩa là item đó cần dữ liệu riêng của project. Mở mục N trong hồ sơ project (`.context/checklist-profile.md`), dùng cái đã có, và ghi thêm cái mới phát hiện.',
    refs: [
      {
        kind: 'lookup',
        key: 'A',
      },
      {
        kind: 'lookup',
        key: 'review',
      },
      {
        kind: 'lookup',
        key: 'I',
      },
      {
        kind: 'lookup',
        key: 'review-round',
      },
      {
        kind: 'lookup',
        key: 'K',
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
        markdown: 'người đưa vấn đề xác nhận Owner đã hiểu đúng vấn đề.',
        refs: [],
      },
      note: {
        markdown:
          '**Đầu ra:** vấn đề, "xong" kèm thước đo và con số hiện tại, phạm vi và edge case. Ghi vào E1, E2, E3 của epic. Câu hỏi và câu trả lời ghi vào E0.',
        refs: [],
      },
      rows: [
        {
          kind: 'task',
          id: 'r1',
          sn: '1.1',
          text: 'Hỏi người đưa vấn đề trong buổi brief',
          description: 'Owner hỏi người đưa vấn đề bộ câu hỏi chung ở tra G, phần G1.',
          items: [
            'Mở đầu bằng câu "Vấn đề bạn đang thấy là gì?".',
            'Owner hỏi thêm những câu mình tự nghĩ ra.',
            'Owner ghi nguyên văn lời người đưa vấn đề.',
          ],
          claude: false,
          refs: [
            {
              kind: 'lookup',
              key: 'G',
            },
            {
              kind: 'project',
              key: '1',
            },
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
          id: 'r2',
          sn: '1.2',
          text: 'Tự phân tích vấn đề',
          description: 'Owner viết trước một bản phân tích gồm các mục dưới đây, rồi Claude kiểm tra.',
          items: [
            'Vấn đề, viết theo lời Owner.',
            'Tình huống dùng (JTBD): mọi lúc người dùng mở tính năng này. Mỗi tình huống là một câu "Khi …, tôi muốn …, để …", và ghi rõ "Trong phạm vi" hay "Ngoài phạm vi".',
            'Những gì trong phạm vi và ngoài phạm vi.',
            'Edge case của từng tình huống, tìm bằng phép thử tờ giấy 📁 §3',
            'Câu hỏi về nhu cầu 📁 §4',
            'Các giả định.',
            'Ai bị ảnh hưởng gián tiếp (team khác, báo cáo, integration, CS), và ai có quyền nói "đúng" 📁 §6, §9',
            'Đầu ra: Claude ghi bản đã chốt vào E1 đến E3 và E0 của epic.',
          ],
          claude: true,
          refs: [
            {
              kind: 'project',
              key: '3',
            },
            {
              kind: 'project',
              key: '4',
            },
            {
              kind: 'project',
              key: '6',
            },
            {
              kind: 'project',
              key: '9',
            },
            {
              kind: 'lookup',
              key: 'F',
            },
            {
              kind: 'lookup',
              key: 'G',
            },
          ],
          doer: 'Owner trước; Claude kiểm tra',
          checker: 'Owner đọc lại bản Claude viết',
          state: 'skipped',
          note: '',
        },
        {
          kind: 'task',
          id: 'r3',
          sn: '1.3',
          text: 'Viết "xong" thành một câu quan sát được',
          description: '"Xong" là một câu quan sát được về người dùng, không phải "màn hình chạy được".',
          items: ['Câu này kèm thước đo và con số hiện tại, để phase 8 có cái so sánh.'],
          claude: false,
          refs: [],
          doer: 'Owner trước; Claude kiểm tra',
          checker: 'Người đưa vấn đề',
          state: 'done',
          note: 'Đã chốt với người đưa vấn đề: xong là khi CS tự đóng ticket, không phải gọi team.',
        },
        {
          kind: 'task',
          id: 'r4',
          sn: '1.4',
          text: 'Gửi vòng confirm',
          description: 'Owner gửi mỗi người đưa vấn đề một tin nhắn gồm các mục dưới đây.',
          items: [
            'Các giả định, để họ trả lời đúng hay sai.',
            'Những câu hỏi về nhu cầu mà họ trả lời được.',
            'Những quyết định ảnh hưởng tới họ, viết thành đề xuất có lựa chọn.',
            'Một mặc định cho từng câu, dùng khi họ không phản hồi.',
            'Trước khi gửi, Owner lọc: tự trả lời những câu mình biết và bỏ những đề xuất sai.',
            'Câu trả lời ghi vào E0.',
          ],
          claude: false,
          refs: [
            {
              kind: 'lookup',
              key: 'G',
            },
          ],
          doer: 'Claude soạn; Owner chốt',
          checker: 'Người đưa vấn đề trả lời',
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
      note: {
        markdown:
          '**Đầu ra:** phương án đã chọn kèm lý do của Owner, blast radius, migration, rabbit hole và appetite. Ghi vào E4 của epic.',
        refs: [],
      },
      rows: [
        {
          kind: 'group',
          id: 'r5',
          sn: '2.1',
          text: 'Viết design doc',
          description: 'Design doc gồm các phần dưới đây.',
          refs: [],
          note: '',
          children: [
            {
              kind: 'task',
              id: 'r6',
              sn: '2.1a',
              text: 'So sánh các phương án',
              description:
                'Design doc có ít nhất hai phương án, phương án được chọn kèm lý do, và các phương án đã loại (alternatives considered).',
              items: [
                'Ít nhất một phương án phải khác hẳn mẫu đang có trong code.',
                'Nếu UI quyết định phương án, mỗi phương án kèm một phác thảo màn hình chính.',
                'Bản nháp ghi nguồn research bên ngoài (pattern, sản phẩm tương tự) và tiền lệ trong code.',
              ],
              claude: true,
              refs: [
                {
                  kind: 'lookup',
                  key: 'I',
                },
              ],
              doer: 'Claude soạn; Owner chốt',
              checker: '⚙ review: tìm điểm yếu; Manager duyệt',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r7',
              sn: '2.1b',
              text: 'Xét cross-cutting concerns',
              description: 'Design doc nói phương án ảnh hưởng thế nào tới bảo mật, dữ liệu và observability.',
              items: [],
              claude: false,
              refs: [
                {
                  kind: 'project',
                  key: '5',
                },
              ],
              doer: 'Claude soạn; Owner chốt',
              checker: 'Manager',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r8',
              sn: '2.1c',
              text: 'Liệt kê blast radius và tương thích',
              description: 'Design doc liệt kê những gì bị ảnh hưởng khi thay đổi.',
              items: [
                'Trong code: chỗ nào gọi hoặc đọc phần bị đổi.',
                'Ngoài code: client cũ, integration, báo cáo và export, cấu hình riêng của khách. Owner bổ sung phần này.',
              ],
              claude: false,
              refs: [
                {
                  kind: 'project',
                  key: '6',
                },
              ],
              doer: 'Claude soạn; Owner chốt',
              checker: 'Owner',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r9',
              sn: '2.1d',
              text: 'Lên kế hoạch cho dữ liệu',
              description:
                'Design doc nói migration chạy thế nào, dữ liệu cũ xử lý ra sao, và có đảo ngược được không.',
              items: [],
              claude: false,
              refs: [
                {
                  kind: 'project',
                  key: '6',
                },
              ],
              doer: 'Claude soạn; Owner chốt',
              checker: 'Manager',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r10',
              sn: '2.1e',
              text: 'Chặn rabbit hole và ghi appetite',
              description: 'Design doc liệt kê những chỗ dễ sa lầy và cách chặn trước.',
              items: [
                'Gồm cả edge case do chính phương án này sinh ra: cache, đồng bộ, migration, giới hạn của thư viện.',
                'Quét danh sách edge case của hệ thống ở tra F.',
                'Ghi appetite: làm trong bao lâu. Nếu vượt appetite thì cắt phạm vi.',
              ],
              claude: false,
              refs: [
                {
                  kind: 'lookup',
                  key: 'F',
                },
              ],
              doer: 'Claude soạn; Owner chốt',
              checker: 'Manager',
              state: 'todo',
              note: '',
            },
          ],
        },
      ],
    },
    {
      id: 'p3',
      number: 3,
      name: 'Flow & Prototype',
      role: 'UI/UX Designer + Business Analyst',
      gate: {
        markdown:
          'Manager đồng ý với flow, danh sách màn hình và mockup, và mỗi mục "Trong phạm vi" đã có ít nhất một flow.',
        refs: [],
      },
      note: {
        markdown:
          '**Đầu ra:** flow, danh sách màn hình, data dictionary, link mockup kèm đủ trạng thái. Ghi vào E5 của epic. Phase này chỉ ghi mã flow và mã màn hình, chưa ghi mã quy tắc.\n\nPhase này áp dụng cho mọi loại ticket: tính năng mới, nâng cấp hoặc refactor, sửa bug. Mỗi loại làm khác nhau. Cách làm ở tra J, phần J1. Ticket không có UI vẫn viết flow (các bước của hệ thống) và danh sách endpoint hoặc event, chỉ bỏ các item về mockup.',
        refs: [
          {
            kind: 'lookup',
            key: 'J',
          },
        ],
      },
      rows: [
        {
          kind: 'task',
          id: 'r11',
          sn: '3.1',
          text: 'Viết flow',
          description: 'Mỗi việc mà người dùng hoặc hệ thống làm là một flow có mã (F1, F2).',
          items: [
            'Mỗi flow gồm các bước đánh số của đường chính.',
            'Mỗi bước có các nhánh rẽ: lỗi, thiếu dữ liệu, hủy, hết phiên, không có quyền.',
          ],
          claude: false,
          refs: [
            {
              kind: 'lookup',
              key: 'J',
            },
            {
              kind: 'project',
              key: '1',
            },
          ],
          doer: 'Claude soạn; Owner chốt',
          checker: '⚙ review: tìm bước và nhánh rẽ còn thiếu',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r12',
          sn: '3.2',
          text: 'Lập danh sách màn hình',
          description: 'Mỗi màn hình, hộp thoại, trang lỗi, email và thông báo có một mã (S1, S2).',
          items: ['Mỗi mã ghi những flow nào đi qua nó.'],
          claude: false,
          refs: [
            {
              kind: 'lookup',
              key: 'J',
            },
          ],
          doer: 'Claude soạn; Owner chốt',
          checker: 'Owner',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r13',
          sn: '3.3',
          text: 'Viết data dictionary',
          description:
            'Mỗi field mới hoặc bị đổi ghi nghĩa, kiểu, định dạng, ví dụ, có bắt buộc hay không, giới hạn và nhãn hiển thị.',
          items: ['Mỗi giá trị của enum có nhãn riêng.'],
          claude: false,
          refs: [
            {
              kind: 'lookup',
              key: 'J',
            },
          ],
          doer: 'Claude soạn; Owner chốt',
          checker: 'Owner',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r14',
          sn: '3.4',
          text: 'Vẽ bảng và sơ đồ bổ sung',
          description: 'Chọn bảng và sơ đồ theo hệ thống.',
          items: [
            'Nếu hệ thống có nhiều role, vẽ ma trận phân quyền.',
            'Nếu entity có vòng đời, vẽ sơ đồ trạng thái.',
            'Nếu có nhiều hệ thống, vẽ thứ tự gọi giữa các hệ thống.',
          ],
          claude: false,
          refs: [
            {
              kind: 'lookup',
              key: 'J',
            },
            {
              kind: 'project',
              key: '5',
            },
            {
              kind: 'project',
              key: '6',
            },
          ],
          doer: 'Claude soạn; Owner chốt',
          checker: 'Manager',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r15',
          sn: '3.5',
          text: 'Chọn người thiết kế',
          description: 'Nếu design system đủ dùng, Owner tự thiết kế.',
          items: ['Nếu không đủ, Owner gọi designer.'],
          claude: false,
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
          id: 'r16',
          sn: '3.6',
          text: 'Làm mockup',
          description: 'Làm mockup hoặc demo bấm được, phủ mọi màn hình ở 3.2.',
          items: ['Owner present rồi ghi lại feedback.'],
          claude: false,
          refs: [],
          doer: 'Claude soạn; Owner chốt',
          checker: 'Manager',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r17',
          sn: '3.7',
          text: 'Vẽ đủ trạng thái màn hình',
          description: 'Mỗi màn hình có đủ các trạng thái áp dụng.',
          items: ['Mỗi trạng thái có câu chữ hiện ra, và câu chữ đó nói người dùng làm gì tiếp.'],
          claude: false,
          refs: [
            {
              kind: 'lookup',
              key: 'J',
            },
            {
              kind: 'project',
              key: '1',
            },
          ],
          doer: 'Claude soạn; Owner chốt',
          checker: 'Manager',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r18',
          sn: '3.8',
          text: 'Xử lý feedback đổi hướng',
          description: 'Nếu feedback ở phase này làm đổi phạm vi hoặc phương án, sửa phase 1 hoặc phase 2 trước.',
          items: ['Sau đó mới sang phase 4.'],
          claude: false,
          refs: [],
          doer: 'Claude soạn; Owner chốt',
          checker: '—',
          state: 'todo',
          note: '',
        },
      ],
    },
    {
      id: 'p4',
      number: 4,
      name: 'Acceptance & Test Design',
      role: 'Business Analyst + Tester',
      gate: {
        markdown:
          'không còn câu hỏi nào chặn việc build. Mỗi mục "Trong phạm vi" và mỗi màn hình đều có quy tắc phủ. Người đưa vấn đề đã xác nhận các ví dụ.',
        refs: [],
      },
      note: {
        markdown:
          '**Đầu ra:** quy tắc có mã, ví dụ có expected, và AC có mã kèm test level. Ghi vào E6 của epic. Câu trả lời của từng câu hỏi ghi vào E0.',
        refs: [],
      },
      rows: [
        {
          kind: 'group',
          id: 'r19',
          sn: '4.1',
          text: 'Làm example mapping',
          description: 'Example mapping biến flow và màn hình của phase 3 thành quy tắc và ví dụ.',
          refs: [],
          note: '',
          children: [
            {
              kind: 'task',
              id: 'r20',
              sn: '4.1a',
              text: 'Viết quy tắc và ví dụ',
              description: 'Viết quy tắc theo từng flow và màn hình của phase 3.',
              items: [
                'Mỗi quy tắc ghi flow hoặc màn hình mà nó thuộc về.',
                'Mỗi quy tắc có ít nhất một ví dụ cụ thể, có số, có tên và có tình huống.',
                'Nếu không viết được ví dụ cho một quy tắc, ghi chỗ đó thành một câu hỏi trong E0.',
              ],
              claude: false,
              refs: [],
              doer: 'Claude soạn; Owner chốt',
              checker: '⚙ review: tìm quy tắc thiếu, ví dụ mâu thuẫn',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r21',
              sn: '4.1b',
              text: 'Biến edge case thành ví dụ',
              description: 'Mỗi edge case của phase 1 và 2, và mỗi nhánh rẽ của flow ở phase 3, có một ví dụ cụ thể.',
              items: [
                'Ví dụ có số, có tên và có expected. Expected nói cả người dùng thấy gì và làm gì tiếp 📁 §3',
                'Nếu một nhánh rẽ đã được pattern có sẵn xử lý (lỗi API, hết phiên, không có quyền, hỏi bỏ thay đổi), không viết ví dụ cho nó. Thay vào đó, ghi một dòng vào bảng hành vi kế thừa của E6: tên pattern, nguồn, chỗ áp dụng và smoke test.',
                'Nếu một quyết định áp dụng cho cả project, đưa nó vào tài liệu chuẩn của project trước, rồi trích dẫn.',
              ],
              claude: false,
              refs: [
                {
                  kind: 'project',
                  key: '3',
                },
              ],
              doer: 'Claude soạn; Owner chốt',
              checker: '⚙ review: tìm edge case còn thiếu (tra F); người đưa vấn đề xác nhận expected',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r22',
              sn: '4.1c',
              text: 'Viết ví dụ cho edge case giá trị',
              description:
                'Với mỗi giới hạn trong data dictionary ở 3.3, viết ví dụ cho giá trị ngay tại ranh giới, ngay trên và ngay dưới.',
              items: ['Kỹ thuật là EP và BVA.'],
              claude: false,
              refs: [
                {
                  kind: 'lookup',
                  key: 'B',
                },
              ],
              doer: 'Claude soạn; Owner chốt',
              checker: 'Owner quyết expected tại từng điểm',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r23',
              sn: '4.1d',
              text: 'Đọc lại bản map',
              description: 'Owner đọc lại toàn bộ bản map rồi quyết định bước tiếp theo.',
              items: [
                'Nếu còn nhiều câu hỏi, chưa build.',
                'Nếu có quá nhiều quy tắc, chia nhỏ tính năng rồi quay lại phase 2.',
                'Nếu một quy tắc cần nhiều ví dụ, làm chậm và kỹ ở quy tắc đó.',
              ],
              claude: false,
              refs: [],
              doer: 'Owner',
              checker: '—',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r24',
              sn: '4.1e',
              text: 'Kiểm phủ quy tắc',
              description:
                'Mỗi mục "Trong phạm vi", mỗi màn hình ở 3.2, và mỗi ô "không" của ma trận phân quyền ở 3.4 (nếu có) phải có ít nhất một quy tắc.',
              items: ['Chỗ nào còn trống thì thêm quy tắc mới, hoặc ghi một câu hỏi trong E0.'],
              claude: false,
              refs: [],
              doer: 'Claude soạn; Owner chốt',
              checker: 'Owner',
              state: 'todo',
              note: '',
            },
          ],
        },
        {
          kind: 'task',
          id: 'r25',
          sn: '4.2',
          text: 'Chọn NFR',
          description: 'Luôn xét ba NFR là performance, phân quyền và bảo mật input.',
          items: ['Các NFR khác thì chọn cái áp dụng, theo danh sách ở tra C.'],
          claude: false,
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
          doer: 'Claude soạn; Owner chốt',
          checker: '—',
          state: 'todo',
          note: '',
        },
        {
          kind: 'group',
          id: 'r26',
          sn: '4.3',
          text: 'Chuyển quy tắc thành test',
          description: 'Mỗi quy tắc thành AC, rồi thành test ở đúng test level.',
          refs: [],
          note: '',
          children: [
            {
              kind: 'task',
              id: 'r27',
              sn: '4.3a',
              text: 'Viết AC',
              description: 'Viết mỗi quy tắc thành AC dạng `WHEN … THE SYSTEM SHALL …`.',
              items: ['Mỗi AC có một ID.'],
              claude: false,
              refs: [],
              doer: 'Claude soạn; Owner chốt',
              checker: 'Owner',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r28',
              sn: '4.3b',
              text: 'Chọn test level',
              description: 'Với từng quy tắc, trả lời ba câu hỏi, rồi chọn kỹ thuật test và test level.',
              items: [],
              claude: false,
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
              doer: 'Claude soạn; Owner chốt',
              checker: 'Owner',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r29',
              sn: '4.3c',
              text: 'Viết test cho hành vi cũ cần giữ',
              description: 'Nếu ticket sửa một tính năng đang chạy, viết test cho hành vi cũ cần giữ trước khi sửa.',
              items: [],
              claude: false,
              refs: [],
              doer: 'Claude soạn; Owner chốt',
              checker: 'Owner',
              state: 'todo',
              note: '',
            },
          ],
        },
        {
          kind: 'task',
          id: 'r30',
          sn: '4.4',
          text: 'Quay lại sửa mockup',
          description: 'Nếu một quy tắc làm đổi màn hình hoặc trạng thái, sửa mockup ở phase 3 trước khi code.',
          items: [],
          claude: false,
          refs: [],
          doer: 'Claude soạn; Owner chốt',
          checker: '—',
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
        markdown: 'Máy báo mọi check đều xanh.',
        refs: [],
      },
      note: {
        markdown:
          '**Đầu ra:** cách làm, test viết trước code, code, và nhật ký tiến độ. Cách làm ghi vào T3, nhật ký ghi vào T4 của task, hoặc vào mục Tasks của epic. Code và test vào commit.',
        refs: [],
      },
      rows: [
        {
          kind: 'group',
          id: 'r31',
          sn: '5.1',
          text: 'Làm từng slice',
          description: 'Mỗi slice đi qua ba bước: cách làm, test, rồi code.',
          refs: [],
          note: '',
          children: [
            {
              kind: 'task',
              id: 'r32',
              sn: '5.1a',
              text: 'Đề xuất cách làm cho slice',
              description:
                'Trước khi code mỗi slice, Claude đề xuất sửa những file nào, và mỗi AC có những test case nào.',
              items: [
                'Owner duyệt đề xuất này.',
                'Đầu ra: mục Approach của task (T3).',
                'Nếu trong lúc làm lộ ra một quy tắc mà epic chưa có, Claude ghi nó thành câu hỏi trong E0 của epic, không tự ghi vào task.',
              ],
              claude: true,
              refs: [],
              doer: 'Claude soạn; Owner chốt',
              checker: 'Owner',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r33',
              sn: '5.1b',
              text: 'Viết test trước code',
              description: 'Claude ở một session mới viết test từ các ví dụ của phase 4, trước khi có code.',
              items: [
                'Giá trị expected lấy từ ví dụ, không lấy từ code đang có.',
                'Mỗi test ghi ID của AC mà nó kiểm tra.',
                'Vòng review R1 chỉ hỏi một câu: test có diễn đạt đúng các ví dụ của phase 4 không.',
                'Owner chỉ chốt phần 1 của file verdicts (các quyết định ở mức sản phẩm). Owner không cần đọc code, finding hay bảng traceability.',
              ],
              claude: true,
              refs: [
                {
                  kind: 'lookup',
                  key: 'H',
                },
                {
                  kind: 'lookup',
                  key: 'K',
                },
              ],
              doer: 'Claude, session mới soạn; Owner chốt',
              checker: '⚙ review-round; Owner chốt',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r34',
              sn: '5.1c',
              text: 'Viết code cho slice',
              description:
                'Claude ở một session mới khác viết code chỉ dựa vào spec và test của 5.1b, không dựa vào code cũ.',
              items: [
                'Đầu ra: các test của 5.1b xanh, và commit theo layer trên nhánh riêng của slice, không lên master.',
                'Session này không được sửa test.',
                'Nếu thấy một test sai, Claude dừng lại và báo Owner. Owner sửa ví dụ ở phase 4 trước, rồi mới sửa test.',
                'Vòng review R2 xét ba góc: code đúng với AC chưa, có thay đổi nào ngoài phạm vi task không, và code có theo luật của repo không.',
                'Nếu slice chạm quyền, dữ liệu cá nhân hoặc redirect, R2 thêm góc bảo mật. Nếu spec có yêu cầu về performance, R2 thêm góc performance 📁 §5',
                'Owner chỉ chốt phần 1 của file verdicts (các quyết định ở mức sản phẩm). Owner không cần đọc code, finding hay bảng traceability.',
              ],
              claude: true,
              refs: [
                {
                  kind: 'project',
                  key: '5',
                },
                {
                  kind: 'lookup',
                  key: 'K',
                },
                {
                  kind: 'lookup',
                  key: 'L',
                },
              ],
              doer: 'Claude, session mới soạn; Owner chốt',
              checker: '⚙ review-round; Owner chốt',
              state: 'todo',
              note: '',
            },
          ],
        },
        {
          kind: 'task',
          id: 'r35',
          sn: '5.2',
          text: 'Chạy check của máy',
          description: 'Máy chạy type check, lint, test và build.',
          items: [],
          claude: false,
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
        markdown: 'Owner xác nhận không còn bug đã biết trong phạm vi.',
        refs: [],
      },
      note: {
        markdown:
          '**Đầu ra:** kết quả kiểm 4 lớp, debrief exploratory, các bug kèm lý do "tại sao lọt", và ghi chú bàn giao. Ghi vào T5 của task.',
        refs: [],
      },
      rows: [
        {
          kind: 'task',
          id: 'r36',
          sn: '6.1',
          text: 'Kiểm mỗi test đã từng đỏ',
          description: 'Mỗi test mới đã từng đỏ ít nhất một lần.',
          items: [],
          claude: false,
          refs: [],
          doer: 'Claude soạn; Owner chốt',
          checker: 'Owner xem output',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r37',
          sn: '6.2',
          text: 'Chạy mutation testing',
          description: 'Nếu logic chạm tiền hoặc quyền, kiểm tra chính bộ test bằng mutation testing.',
          items: ['Làm sau khi code đã có và test đã xanh.'],
          claude: false,
          refs: [
            {
              kind: 'project',
              key: '7',
            },
          ],
          doer: 'Máy',
          checker: 'Owner đọc mutation score',
          state: 'todo',
          note: '',
        },
        {
          kind: 'group',
          id: 'r38',
          sn: '6.3',
          text: 'Review phần sửa và đọc diff',
          description: 'Phần sửa sau R2 được review trước, rồi Owner mới đọc diff.',
          refs: [],
          note: '',
          children: [
            {
              kind: 'task',
              id: 'r39',
              sn: '6.3a',
              text: 'Review phần sửa sau R2',
              description: 'Mọi thay đổi đổi logic sau vòng R2 đi qua bước review của `/cap`.',
              items: [
                'Ví dụ: lần sửa CI, hoặc fixup đổi logic.',
                'Nếu không có thay đổi nào đổi logic thì bỏ qua bước này.',
              ],
              claude: true,
              refs: [
                {
                  kind: 'lookup',
                  key: 'L',
                },
              ],
              doer: 'Claude soạn; Owner chốt',
              checker: 'Review của `/cap`; Owner chốt',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r40',
              sn: '6.3b',
              text: 'Đọc diff nguội',
              description: 'Owner đọc diff khi đầu óc đã nguội và giải thích được từng dòng.',
              items: [
                'Trước khi đọc, Owner xem thẻ coverage ở đầu file verdicts của R2: góc nào đã review và góc nào chưa.',
                'Owner đọc lần lượt từng commit trên nhánh của slice.',
                'Owner tập trung vào ý định và cảm nhận sản phẩm, và nhìn từ góc người dùng và người vận hành.',
                'Nếu R2 đã review góc bảo mật, Owner chỉ đọc lướt từ góc kẻ tấn công.',
                'Tìm cả những thay đổi không liên quan tới task.',
                'Dòng nào chưa giải thích được thì chưa merge.',
                'Nếu cần sửa, Claude sửa rồi gộp vào commit gốc.',
              ],
              claude: true,
              refs: [
                {
                  kind: 'lookup',
                  key: 'D',
                },
                {
                  kind: 'lookup',
                  key: 'L',
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
          id: 'r41',
          sn: '6.4',
          text: 'Chạy thử migration',
          description: 'Owner chạy thử migration trên một bản sao dữ liệu giống thật.',
          items: [],
          claude: false,
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
          id: 'r42',
          sn: '6.5',
          text: 'Tự kiểm 4 lớp trên app thật',
          description: 'Owner kiểm theo thứ tự, và nếu lớp trước hỏng thì chưa sang lớp sau.',
          refs: [],
          note: '',
          children: [
            {
              kind: 'task',
              id: 'r43',
              sn: '6.5a',
              text: 'Chạy đường hạnh phúc (lớp 1)',
              description:
                'Owner chạy đúng kịch bản chính bằng tay, như người dùng thật, theo các ví dụ của phase 4 và flow của phase 3.',
              items: ['Lớp này không phải là "unit test pass".'],
              claude: false,
              refs: [],
              doer: 'Owner',
              checker: '—',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r44',
              sn: '6.5b',
              text: 'Chạy edge case (lớp 2)',
              description: 'Owner chạy các edge case đã thành ví dụ ở phase 4.',
              items: ['Xem từng trạng thái của màn hình khi có thứ bị lỗi (tra J, phần J4).'],
              claude: false,
              refs: [
                {
                  kind: 'lookup',
                  key: 'J',
                },
              ],
              doer: 'Owner',
              checker: '—',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r45',
              sn: '6.5c',
              text: 'Kiểm hồi quy quanh chỗ sửa (lớp 3)',
              description: 'Owner mở thử ít nhất một chỗ dùng chung hàm, component hoặc endpoint vừa sửa.',
              items: ['Claude tìm sẵn danh sách những chỗ dùng chung đó, bắt đầu từ blast radius ở phase 2.'],
              claude: true,
              refs: [
                {
                  kind: 'project',
                  key: '6',
                },
              ],
              doer: 'Claude soạn; Owner chốt',
              checker: '—',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r46',
              sn: '6.5d',
              text: 'Thử với dữ liệu thật (lớp 4)',
              description: 'Owner thử với dữ liệu cũ, dữ liệu bẩn, thiếu field hoặc sai format.',
              items: ['Không dùng seed sạch.'],
              claude: false,
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
          id: 'r47',
          sn: '6.6',
          text: 'Khám phá exploratory 30 phút',
          description:
            'Owner khám phá theo một charter "Khám phá ‹vùng› với ‹cách hoặc dữ liệu› để tìm ‹loại vấn đề›".',
          items: ['Owner ghi lại bug, câu hỏi và ý tưởng.'],
          claude: false,
          refs: [],
          doer: 'Owner',
          checker: '—',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r48',
          sn: '6.7',
          text: 'Kiểm NFR',
          description: 'Owner kiểm các NFR đã chọn ở phase 4.',
          items: [],
          claude: false,
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
          id: 'r49',
          sn: '6.8',
          text: 'Viết ghi chú bàn giao',
          description: 'Ghi chú bàn giao nói đổi những gì, test ở đâu, và rủi ro nằm ở đâu.',
          items: [],
          claude: false,
          refs: [
            {
              kind: 'project',
              key: '9',
            },
          ],
          doer: 'Claude soạn; Owner chốt',
          checker: 'Tester (nếu có)',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r50',
          sn: '6.9',
          text: 'Hỏi trước khi merge',
          description:
            'Nếu ticket chạm tiền, hóa đơn hoặc integration, Owner luôn hỏi trước khi merge và gửi kèm ghi chú bàn giao.',
          items: ['Owner không tự quyết, kể cả khi đã quen việc.'],
          claude: false,
          refs: [
            {
              kind: 'project',
              key: '9',
            },
          ],
          doer: 'Owner',
          checker: 'Manager (hoặc người được chỉ định ở 📁 §9)',
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
        markdown: 'rollout ở PROD đã xong, và các chỉ số đã chốt nằm trong ngưỡng.',
        refs: [],
      },
      note: {
        markdown: '**Đầu ra:** cách rollback, các chỉ số và ngưỡng, và kết quả ở từng môi trường. Ghi vào T6 của task.',
        refs: [],
      },
      rows: [
        {
          kind: 'group',
          id: 'r51',
          sn: '7.1',
          text: 'Chuẩn bị trước khi release',
          description: 'Bốn việc dưới đây xong trước khi đưa code lên bất kỳ môi trường nào.',
          refs: [],
          note: '',
          children: [
            {
              kind: 'task',
              id: 'r52',
              sn: '7.1a',
              text: 'Viết kế hoạch rollback',
              description: 'Viết trước khi release cách rollback, ai làm, và feature flag nào.',
              items: ['Ghi cả migration, config và env của từng môi trường.'],
              claude: false,
              refs: [
                {
                  kind: 'project',
                  key: '8',
                },
              ],
              doer: 'Claude soạn; Owner chốt',
              checker: 'Manager',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r53',
              sn: '7.1b',
              text: 'Diễn tập rollback',
              description: 'Owner diễn tập rollback ít nhất một lần ở SIT hoặc UAT.',
              items: [],
              claude: false,
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
              id: 'r54',
              sn: '7.1c',
              text: 'Chốt chỉ số và ngưỡng',
              description: 'Chốt trước sẽ theo dõi chỉ số nào, và ngưỡng nào thì rollback.',
              items: [],
              claude: false,
              refs: [
                {
                  kind: 'project',
                  key: '8',
                },
              ],
              doer: 'Claude soạn; Owner chốt',
              checker: 'Manager',
              state: 'todo',
              note: '',
            },
            {
              kind: 'task',
              id: 'r55',
              sn: '7.1d',
              text: 'Báo trước cho người bị ảnh hưởng',
              description: 'Báo cho CS và những người bị ảnh hưởng biết đổi gì, khi nào, và hỏi ai.',
              items: [],
              claude: false,
              refs: [
                {
                  kind: 'project',
                  key: '9',
                },
              ],
              doer: 'Claude soạn; Owner chốt',
              checker: 'Người đưa vấn đề',
              state: 'todo',
              note: '',
            },
          ],
        },
        {
          kind: 'group',
          id: 'r56',
          sn: '7.2',
          text: 'Đưa lên từng bước',
          description: 'Code đi qua từng môi trường, rồi mới mở dần cho người dùng ở PROD.',
          refs: [],
          note: '',
          children: [
            {
              kind: 'task',
              id: 'r57',
              sn: '7.2a',
              text: 'Đưa qua từng môi trường',
              description: 'Owner đưa lên SIT, rồi UAT, rồi PROD.',
              items: ['Chạy smoke test sau mỗi bước.'],
              claude: false,
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
              id: 'r58',
              sn: '7.2b',
              text: 'Rollout từng phần ở PROD',
              description: 'Owner bật feature flag, rồi mở cho nội bộ, rồi cho một nhóm nhỏ, rồi cho toàn bộ.',
              items: [],
              claude: false,
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
        markdown: 'Owner đã so thước đo ở phase 1 với kết quả thật.',
        refs: [],
      },
      note: {
        markdown:
          '**Đầu ra:** thước đo so với con số hiện tại, và một dòng bài học. Ghi vào E7 của epic. Bài học ghi thêm vào hồ sơ project.',
        refs: [],
      },
      rows: [
        {
          kind: 'task',
          id: 'r59',
          sn: '8.1',
          text: 'Theo dõi sau release',
          description: 'Owner theo dõi lỗi, log và các chỉ số đã chốt ở phase 7, trong số ngày ghi ở hồ sơ project.',
          items: ['Owner báo lại kết quả.'],
          claude: false,
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
          id: 'r60',
          sn: '8.2',
          text: 'Xem lại thước đo',
          description: 'Sau một mốc thời gian cố định, Owner so thước đo ở phase 1 với kết quả thật.',
          items: [],
          claude: false,
          refs: [],
          doer: 'Owner',
          checker: 'Người đưa vấn đề',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r61',
          sn: '8.3',
          text: 'Viết as-built doc',
          description: 'As-built doc ghi lại hệ thống đã được làm ra như thế nào.',
          items: [],
          claude: false,
          refs: [
            {
              kind: 'project',
              key: '10',
            },
          ],
          doer: 'Claude soạn; Owner chốt',
          checker: 'Owner',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r62',
          sn: '8.4',
          text: 'Dọn dẹp code tạm',
          description: 'Gỡ feature flag và code tạm, nếu có.',
          items: [],
          claude: false,
          refs: [],
          doer: 'Claude soạn; Owner chốt',
          checker: 'Owner đọc diff',
          state: 'todo',
          note: '',
        },
        {
          kind: 'task',
          id: 'r63',
          sn: '8.5',
          text: 'Ghi bài học',
          description: 'Owner ghi một dòng bài học vào hồ sơ project.',
          items: ['Nếu bài học đó lặp lại ở project thứ hai, sửa checklist.'],
          claude: false,
          refs: [],
          doer: 'Owner trước; Claude kiểm tra',
          checker: '—',
          state: 'todo',
          note: '',
        },
      ],
    },
  ],
  footer: {
    markdown: 'Gặp bug ở bất kỳ phase nào: xem tra E.',
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
      title: 'Chọn size',
      markdown:
        'Size chọn theo **rủi ro**, không theo "tính năng mới hay sửa cũ".\n\n| Size | Dấu hiệu | Phase chạy |\n| --- | --- | --- |\n| **L** | Có **một** trong: đổi hành vi người dùng đang dựa vào · chạm tiền, quyền, dữ liệu, migration · nhiều hệ thống · khó đảo ngược | Đủ 8 phase, phase 2 có design doc |\n| **S** | Rõ nguyên nhân, chạm một chỗ, đảo ngược dễ | 1 (một câu) → 5 → 6 → 7 |\n| **M** | Còn lại | Đủ 8 phase, bản rút gọn |\n\n**Nâng size** ngay khi đang làm mà gặp dấu hiệu của size cao hơn. Không bao giờ hạ size giữa chừng để kịp giờ.',
    },
    {
      key: 'B',
      title: 'Ba câu hỏi, kỹ thuật, test level',
      markdown:
        '**Ba câu hỏi cho từng quy tắc**\n\n1. Sai ở đâu thì đắt? → dồn test vào đó. Gán field, hành vi của framework thì không test.\n2. "Đúng" lấy từ đâu? → từ quy tắc và AC, **không** từ code.\n3. Bao nhiêu là đủ? → chọn kỹ thuật bên dưới, đếm coverage item.\n\n**Chọn kỹ thuật theo hình dạng input**\n\n| Hình dạng | Kỹ thuật | Ai làm |\n| --- | --- | --- |\n| Khoảng giá trị | EP + BVA | Claude sinh, Owner kiểm edge case |\n| Nhiều điều kiện đan nhau trong cùng một quy tắc | Decision table | Claude dựng, Owner thẩm định: thiếu/thừa điều kiện, tổng cột, N/A có lý do |\n| Nhiều tham số độc lập (trình duyệt × ngôn ngữ × vai trò) | Pairwise | Tool (PICT) |\n| Có trạng thái và chuyển trạng thái | State transition | Claude vẽ, Owner kiểm chuyển không hợp lệ |\n| Luồng nhiều bước | Scenario test theo đường đi | Owner chọn đường đi |\n| Có quy luật bất biến | Property-based | Claude viết, Owner duyệt quy luật |\n\n**Test level**\n\n- Logic trong một hàm hoặc một class → unit\n- **Chỗ ghép nối** giữa hai module, hoặc với DB hay dịch vụ ngoài → integration (unit không bắt được)\n- Luồng người dùng quan trọng nhất → E2E, ít thôi',
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
        '1. Chốt **severity** (hỏng nặng cỡ nào) và **priority** (gấp cỡ nào) → sửa ngay, hoặc mở ticket **có hạn**. Không để dồn trong backlog.\n2. Ghi repro steps; tái hiện bằng một test **đỏ** trước khi sửa (debugging).\n3. Sửa → test đó xanh (confirmation testing) → chạy lại bộ test liên quan (regression testing).\n4. Ghi **một dòng: lỗi gì, tại sao lọt** vào run log của ticket. "Tại sao lọt" trỏ tới **phase và dòng** của checklist (ở phase 6 thì tới lớp 1–4), vì bug có thể lọt ở bất kỳ phase nào: hiểu sai vấn đề, thiếu quy tắc, expected chép từ code, không đọc diff, môi trường release. Sau vài tháng, các dòng này là khuôn mẫu lỗi của chính Owner. Nếu là lỗ hổng của quy trình thì sửa checklist.\n5. Bug hay tụ cụm: kiểm tra thêm vùng code quanh chỗ vừa sửa.',
    },
    {
      key: 'F',
      title: 'Danh sách quét edge case (chung cho mọi project)',
      markdown:
        'Edge case của **giá trị** (số, độ dài) thì dùng EP + BVA ở mục B. Edge case riêng của từng project nằm trong hồ sơ project ở `.context/checklist-profile.md`. Phase 4 dùng cả hai phần dưới đây làm danh sách kiểm tra chỗ còn thiếu.\n\n**Phép thử tờ giấy:** nếu người dùng làm việc này bằng một cuốn sổ giấy, chuyện đó vẫn xảy ra không? Có → edge case của tình huống, ghi ở phase 1. Không → edge case do phương án sinh ra, để phase 2.\n\n**Phần 1 · Edge case của tình huống** (phase 1; Claude quét sau lượt tự phân tích của Owner):\n\n1. Khi nào việc này khó hơn bình thường: đang gấp, một tay, ở nơi lạ, mạng yếu?\n2. Thông tin sai hoặc đã cũ thì sao?\n3. Có nhiều hơn một không: nhiều người, nhiều món, nhiều mục đích?\n4. Việc này dừng, đổi, hay lặp lại thế nào?\n5. Bị dùng sai thì sao, và ai chịu hậu quả?\n\n**Phần 2 · Edge case hệ thống** (phase 2, dòng rabbit hole):\n\n- Rỗng (chưa có dữ liệu nào)\n- Rất nhiều (danh sách dài, file lớn)\n- Hai người cùng sửa một thứ\n- Mất mạng giữa chừng\n- Dữ liệu lịch sử sai định dạng\n- Hệ thống bên ngoài chậm hoặc lỗi',
    },
    {
      key: 'G',
      title: 'Câu hỏi phase 1',
      markdown:
        '### G1. Bộ câu hỏi buổi brief (dùng chung cho mọi vấn đề)\n\nCâu nào cũng mở và không nói tới giải pháp. Owner hỏi trong buổi brief và ghi nguyên văn câu trả lời. Câu nào hồ sơ project đã trả lời thì Owner nêu ra như một giả định, chỉ hỏi phần lệch (Claude làm theo skill `checklist` của plugin ctx).\n\n1. Vấn đề bạn đang thấy là gì?\n2. Kể một lần cụ thể gần đây nó xảy ra. Bao lâu thì nó xảy ra một lần?\n3. Ai gặp vấn đề này? Nó liên quan tới thông tin của ai, mấy người?\n4. Hôm nay bạn đang xoay xở thế nào?\n5. Nếu không làm thì sao?\n6. Vì sao lúc này? Có hạn chót hay giới hạn công sức không?\n7. Khi xong, bạn sẽ thấy điều gì khác đi?\n8. Tôi nên hỏi thêm ai, xem tài liệu hay dữ liệu nào? Câu này quyết định vòng confirm gửi cho những ai.\n\n### G2. Danh mục kiểm tra lúc tự phân tích\n\n**Cách dùng:** Claude đọc lướt sau lượt của Owner và đánh dấu câu nào chưa có câu trả lời. Thường chỉ 3–4 câu sáng lên; đừng hỏi hết. Câu hỏi riêng của project nằm ở hồ sơ project §4.\n\n**Phép thử trước khi đưa vào vòng confirm:** người đưa vấn đề có trả lời được câu này không? Được → câu hỏi nhu cầu, gửi nguyên câu. Không → câu thiết kế; Claude đổi nó thành đề xuất có lựa chọn và mặc định.\n\n1. **Người và bối cảnh.** Ai bấm vào đây? Lúc đó họ đang ở đâu, tay có rảnh không, mạng thế nào? Một ngày họ làm việc này 1 lần hay 50 lần?\n2. **Dữ liệu từ đâu.** Nhập tay, import, integration, hay hệ thống tự tính? Trường nào bắt buộc, và ai là người quyết định điều đó? Dữ liệu lịch sử có đúng định dạng này không?\n3. **Ai được làm gì.** Ai xem được, ai sửa được? Sửa sau khi việc đã đóng thì sao? Có cần dấu vết ai sửa gì không? Tính năng này có trên gói nào?\n4. **Trạng thái và thời gian.** Có bao nhiêu trạng thái, và đi ngược được không? Cái gì tự động, cái gì cần người bấm? Quá hạn thì sao, hủy giữa đường thì sao? *(Nhóm này sáng lên → dùng state transition ở tra B.)*\n5. **Cái gì vỡ.** Đã quét bằng tra F phần 1; bỏ qua nhóm này.\n6. **Tiền.** Cái này có chạm vào hóa đơn không? Nếu đã đẩy sang kế toán rồi mà sửa thì sao? Ai chịu hậu quả nếu số sai: khách, người làm, hay công ty? *(Nhóm này sáng lên → nâng lên size L.)*',
    },
    {
      key: 'H',
      title: 'Tự động hay làm tay',
      markdown:
        'Danh sách test case là của **Owner**, không phải của Claude. Nguồn của nó là flow ở phase 3, ví dụ và edge case ở phase 4: edge case nghĩ ra lúc đặc tả chính là test case lúc kiểm.\n\n| Loại | Cách kiểm | Lưu ý |\n| --- | --- | --- |\n| Logic thuần: hàm tính toán, transform dữ liệu, quy tắc validation (input/output rõ ràng) | Claude viết **code của test** | **Expected lấy từ quy tắc và ví dụ của phase 4, không đọc từ code.** Test lấy expected từ code thì sai cùng với code mà vẫn xanh (test oracle problem, "reverse TDD") |\n| Luồng người dùng, cái thật sự hiện trên màn hình, hiệu năng cảm nhận được | Owner làm tay (tự kiểm 4 lớp ở phase 6) | Claude không biết người dùng đang đứng ở đâu, tay có rảnh không (📁 §1) |\n| Chỗ ghép nối nhiều hệ (module với module, app với DB hay dịch vụ ngoài) | Làm tay lần đầu, rồi viết **integration test** tự động | Unit test không bắt được lỗi ở chỗ ghép nối |\n| Đường chính quan trọng nhất | Làm tay lần đầu, rồi viết **E2E** | Để khỏi phải kiểm tay lại mỗi lần release; giữ số E2E ít |',
    },
    {
      key: 'I',
      title: 'Review độc lập ⚙ review',
      markdown:
        'Item nào ghi "⚙ review" thì làm theo mục này. Phần sau dấu hai chấm (ví dụ "⚙ review: tìm edge case còn thiếu") là câu hỏi cho reviewer.\n\n1. Hai reviewer chạy độc lập: Claude, session mới (subagent context sạch) và Codex (ChatGPT qua plugin codex). Không reviewer nào thấy kết quả của người kia.\n2. Cả hai nhận cùng một context packet, và không nhận ý kiến hay kết luận của Claude.\n3. Claude ở thread chính gộp kết quả, và ghi mỗi finding là đúng, sai, hay chưa chắc. Claude không tự biến finding thành quyết định.\n4. Owner lọc finding: giữ, bỏ, hay để sau. Finding giữ lại thành việc cần sửa hoặc thẻ câu hỏi.\n5. Nếu Codex hết quota hoặc lỗi, báo cáo ghi "thiếu Codex".',
    },
    {
      key: 'J',
      title: 'Flow, màn hình và trạng thái',
      markdown:
        'Phase 3 dùng mục này. Mục này viết cho cả hệ thống nhiều role, nhiều team; phần nào không áp dụng cho ticket thì bỏ qua, không bỏ khỏi bảng.\n\n### J1. Theo loại ticket\n\nSize vẫn chọn theo rủi ro (tra A). Bảng này chỉ nói phase 3 làm gì khác nhau theo loại ticket. Bug ở size S đi theo tra E, không qua phase 3.\n\n| Loại ticket | Flow | Danh sách màn hình | Data dictionary | Mockup và trạng thái |\n| --- | --- | --- | --- | --- |\n| **Tính năng mới** | Flow mới, đủ nhánh rẽ ở từng bước | Màn hình mới, và màn hình cũ có đổi | Mọi trường mới | Đủ trạng thái áp dụng (J4) |\n| **Nâng cấp hoặc refactor** | Flow đang chạy, viết lại đúng như hiện tại; đánh dấu bước nào đổi bên trong. Flow này là hành vi phải giữ (4.3c) | Màn hình chịu ảnh hưởng; danh sách này là danh sách kiểm hồi quy ở phase 6 | Trường đổi kiểu, đổi tên, đổi nghĩa, đổi giới hạn | Chỉ khi UI đổi. UI không đổi thì chụp màn hình trước khi sửa để so sau khi sửa |\n| **Sửa bug** | Flow có bug: các bước tái hiện là một nhánh rẽ; ghi bước nào sai và bước đúng phải là gì | Màn hình hiện bug, và màn hình dùng chung chỗ sửa | Trường liên quan tới bug (giá trị bẩn, sai định dạng, rỗng) | Trạng thái đúng mà màn hình phải hiện sau khi sửa |\n| **Không có UI** (API, job, integration) | Các bước của hệ thống và của hệ thống bên ngoài | Endpoint, event, message, file thay cho màn hình | Payload và mã lỗi | Bỏ |\n\n### J2. Cách viết flow\n\nMột flow là một việc người dùng hoặc hệ thống làm cho xong, từ lúc bắt đầu tới lúc thấy kết quả. Flow có mã (F1, F2) để quy tắc và màn hình trỏ tới.\n\n1. Viết đường chính: các bước đánh số, mỗi bước một hành động của người dùng hoặc một phản hồi của hệ thống.\n2. Ở từng bước, quét nhánh rẽ theo danh sách dưới. Mỗi nhánh có mã theo bước (bước 3 thì 3a, 3b) và ghi hệ thống làm gì, người dùng làm gì tiếp.\n3. Nhánh rẽ nào kéo theo một quyết định thì thành thẻ câu hỏi ở E0.\n\nDanh sách quét nhánh rẽ ở mỗi bước:\n- Dữ liệu nhập sai, thiếu, trùng\n- Server lỗi, mạng mất, hệ thống ngoài chậm hoặc lỗi\n- Hết phiên đăng nhập, không có quyền ở bước này\n- Người dùng hủy, quay lại, đóng tab giữa chừng\n- Hai người cùng sửa một thứ; dữ liệu đã đổi từ lúc mở\n- Dữ liệu cũ, dữ liệu lịch sử sai định dạng\n\nVí dụ:\n> **F1 · Owner thêm một món**\n> 1. Owner mở danh sách món ở console, bấm "Thêm".\n> 2. Owner điền form, bấm "Lưu".\n> 3. Hệ thống lưu, đóng form, hiện món mới ở đầu danh sách, hiện thông báo "Đã lưu".\n>\n> 2a. Thiếu trường bắt buộc: form báo lỗi ở đúng ô, không gửi; Owner điền rồi lưu lại.\n> 3a. Server lỗi: form giữ nguyên dữ liệu đã nhập, hiện lỗi, nút "Lưu" bấm lại được.\n> 3b. Hết phiên: chuyển sang đăng nhập; đăng nhập xong quay lại form, dữ liệu còn.\n\n### J3. Danh sách màn hình\n\n| Mã | Màn hình | App | Flow đi qua | Trạng thái áp dụng (J4) |\n| --- | --- | --- | --- | --- |\n| S1 | Danh sách món | console | F1, F2 | rỗng, đang tải, lỗi, thành công |\n\nMỗi hộp thoại xác nhận, trang lỗi, email, thông báo đẩy cũng là một dòng. Bảng này không có cột quy tắc, vì quy tắc chỉ có ở phase 4. Ở phase 4, mỗi quy tắc ghi các màn hình nó phủ; màn hình nào không có quy tắc nào phủ thì dòng 4.1e bắt được.\n\n### J4. Trạng thái của một màn hình\n\nMỗi màn hình chọn những trạng thái áp dụng. Mỗi trạng thái ghi câu chữ hiện ra và người dùng làm gì tiếp. Thông báo lỗi nằm ngay cạnh chỗ có vấn đề và giữ lại dữ liệu người dùng đã nhập.\n\n| Trạng thái | Khi nào | Hỏi gì |\n| --- | --- | --- |\n| Lần đầu dùng | Chưa có dữ liệu nào, kể cả dữ liệu phụ thuộc (chưa có người, chưa có danh mục) | Người dùng bắt đầu từ đâu? |\n| Rỗng | Có dữ liệu nhưng danh sách này trống | Khác gì với "lần đầu dùng"? |\n| Không có kết quả | Tìm kiếm hoặc lọc không ra gì | Xóa bộ lọc bằng cách nào? |\n| Đang tải | Chờ server | Có giữ layout không, chờ lâu thì sao? |\n| Một phần | Dữ liệu thiếu nhiều trường, hoặc tải được một phần | Trường trống hiện thế nào? |\n| Lỗi | Server lỗi, dữ liệu sai | Thử lại ở đâu, dữ liệu đã nhập còn không? |\n| Mất mạng | Không kết nối được | Có cần làm không, hay chỉ báo lỗi? |\n| Không có quyền | Role không được xem hoặc làm | Thấy gì: ẩn, khóa, hay trang báo? |\n| Thành công | Lưu, xóa, gửi xong | Thông báo gì, rồi đi đâu? |\n\n### J5. Data dictionary\n\n| Trường | Nghĩa | Kiểu | Định dạng, ví dụ | Bắt buộc | Giới hạn | Nhãn hiển thị |\n| --- | --- | --- | --- | --- | --- | --- |\n| `strength` | Lượng hoạt chất trong một đơn vị thuốc | text | "500mg" | có, với thuốc | 1–50 ký tự | Hàm lượng |\n| `dose` | Lượng dùng mỗi lần | text | "2 viên" | không | 0–100 ký tự | Liều |\n\nEnum ghi từng giá trị và nhãn của nó (`LONG_TERM` → "Dùng lâu dài"). Hai trường dễ nhầm nghĩa với nhau thì ghi rõ khác nhau ở đâu. Cột "Giới hạn" là đầu vào của EP + BVA ở 4.1c.\n\n### J6. Hệ thống phức tạp: chỉ làm khi áp dụng\n\n| Khi nào | Làm gì | Đầu ra |\n| --- | --- | --- |\n| Nhiều role (admin, nhân viên, khách, đối tác, machine token) | **Ma trận phân quyền**: role × hành động (xem, tạo, sửa, xóa, duyệt, export), và role × màn hình | Bảng; mỗi ô "không" thành một ví dụ ở phase 4 |\n| Entity có vòng đời (đơn hàng, hồ sơ, yêu cầu duyệt) | **Sơ đồ trạng thái**: trạng thái, sự kiện chuyển, ai bấm hay hệ thống tự làm, bước nào không đi ngược được (state transition ở tra B) | Sơ đồ hoặc bảng chuyển trạng thái |\n| Nhiều hệ thống (integration, queue, webhook) | **Thứ tự gọi giữa các hệ thống**: ai gọi ai, gọi lại khi lỗi, gửi trùng thì sao (idempotency), hết thời gian chờ thì sao | Sequence diagram hoặc danh sách bước |\n| Nhiều bước duyệt hoặc nhiều người cùng làm | Flow theo từng role (swimlane); bàn giao giữa các role | Flow có cột theo role |\n| Thước đo ở phase 1 cần số liệu từ app | **Sự kiện analytics**: tên, lúc bắn, thuộc tính; không chứa dữ liệu nhạy cảm | Danh sách sự kiện |\n| Dữ liệu cần dấu vết ai sửa gì | **Audit**: hành động nào được ghi, giữ bao lâu | Danh sách hành động |\n\nKhông đưa vào checklist: user story theo mẫu "As a…", story point, Definition of Ready riêng của team. Đây là công cụ phối hợp giữa nhiều developer; phase 1 và cổng "Qua phase khi" đã làm phần việc của chúng.',
    },
    {
      key: 'K',
      title: 'Review sau khi sinh code hoặc test ⚙ review-round',
      markdown:
        'Item nào ghi "⚙ review-round" thì Claude chạy skill `review-round` sau khi sinh xong một đợt code hoặc test, trước khi Owner xem và trước khi commit.\n\n1. Hai reviewer chạy song song: một subagent Claude và Codex. Claude kiểm tra từng finding, sửa các finding đúng, rồi chạy lại test.\n2. Owner chỉ chốt phần 1 của file verdicts: các quyết định đổi điều người dùng thấy hoặc đổi spec đã duyệt. Finding, bảng traceability và kết quả chạy lại chỉ để tham khảo.\n3. File cho Owner đọc nằm trong `.context/tmp/` của repo.\n4. Mỗi vòng có góc nhìn riêng. Vòng R1 chạy sau khi viết test và chỉ hỏi test có diễn đạt đúng các ví dụ không. Vòng R2 chạy sau khi viết code, trước khi commit, và review ba góc: correctness theo AC, thay đổi ngoài phạm vi task, và luật của repo.\n5. Cờ rủi ro bật thêm góc chuyên môn. Nếu slice chạm quyền, dữ liệu cá nhân hoặc redirect, R2 thêm góc bảo mật. Nếu spec có yêu cầu về performance, R2 thêm góc performance.\n6. Đầu mỗi file verdicts có một thẻ coverage. Thẻ này liệt kê các góc đã review, số finding của mỗi góc, và các góc chưa review. Owner đọc thẻ này trước khi đọc diff, để biết phần nào Owner phải tự soi (mục D).\n7. Mọi thay đổi sau R2 mà đổi logic, ví dụ lần sửa CI hoặc fixup, đi qua bước review của `/cap` thay vì một vòng review-round mới.\n\nKhác với ⚙ review (mục I): ở mục I, Owner tự lọc finding. Ở mục này, Claude tự quyết các finding kỹ thuật.',
    },
    {
      key: 'L',
      title: 'Commit trên nhánh riêng và review theo commit',
      markdown:
        'Code của một slice đi qua năm bước, từ lúc Claude viết tới lúc Owner duyệt xong:\n\n1. Claude viết code trên nhánh riêng của slice, ví dụ `feat/<epic>-s1`. Với size M, cả task là một slice, ví dụ nhánh `feat/<task>`. Claude không commit lên master.\n2. Claude chạy vòng R2 của ⚙ review-round (mục K). Nếu review sinh ra quyết định ở mức sản phẩm, Claude hỏi Owner trước khi commit.\n3. Claude tách commit theo layer: shared, API, console, landing, e2e. Commit nào cũng tự xanh. Owner duyệt danh sách commit và message, rồi Claude commit và push nhánh.\n4. Owner review từng commit một, theo cách đọc ở mục D. Claude nói thẳng trong session file nào cần đọc kỹ và file nào chỉ cần đọc lướt.\n5. Nếu Owner yêu cầu sửa, Claude gộp mỗi chỗ sửa vào đúng commit gốc của layer. Nhánh vẫn giữ một commit cho mỗi layer và không có commit "fix review" riêng.\n\nNhánh chỉ merge vào master sau khi phase 6 xong.',
    },
  ],
};

/**
 * A run made before format 2: rows with their text alone (no SN, description or list), as the old
 * table checklist stored them. Its first two phases are enough to show that it still renders.
 */
export const DDL_CHECKLIST_OLD_RUN: ChecklistRunBody = {
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
          text: 'Chia nhỏ thành các lần release độc lập nếu được<br>Mỗi lần release tự chạy được và tự có giá trị<br>Slice đầu tiên là slice mỏng nhất đi hết từ đầu tới cuối',
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

/** The old portfolio profile, which an old run's `📁 §N` refs still open. A new run's profile is in the project's repo. */
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
