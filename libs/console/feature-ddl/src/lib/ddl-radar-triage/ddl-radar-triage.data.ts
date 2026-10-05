import type { FilterOption, SegmentedControlOption } from '@portfolio/console/shared/ui';
import type { TriageItem, TriageScreen } from './ddl-radar-triage.types';

/** Common laptop and desktop widths (CSS px). MacBook Air 13 = 1470, MacBook Pro 14 = 1512. */
export const SCREENS: TriageScreen[] = [
  { value: '1280', label: '1280', width: 1280 },
  { value: '1440', label: '1440', width: 1440 },
  { value: '1512', label: '1512 · MBP 14', width: 1512 },
  { value: '1920', label: '1920', width: 1920 },
];

export const SCREEN_OPTIONS: SegmentedControlOption[] = SCREENS.map(({ value, label }) => ({ value, label }));

/** Matches the shell: `ui-sidebar` is 240px expanded, 64px compact (Cmd+B toggles). */
export const SIDEBAR_OPTIONS: SegmentedControlOption[] = [
  { value: '240', label: 'Sidebar 240' },
  { value: '64', label: 'Sidebar 64' },
];

export const DENSITY_OPTIONS: SegmentedControlOption[] = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
];

export const SORT_OPTIONS: FilterOption[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'score', label: 'Highest score' },
  { value: 'source', label: 'Source A to Z' },
];

export const PROVIDER_FILTER: FilterOption[] = ['Anthropic', 'Open source', 'DeepSeek', 'Google', 'Other'].map((p) => ({
  value: p,
  label: p,
}));

export const TYPE_FILTER: FilterOption[] = ['News', 'Tool', 'Workflow', 'Opinion', 'Promo'].map((t) => ({
  value: t,
  label: t,
}));

export const SCORE_FILTER: FilterOption[] = [
  { value: '7', label: '7+ worth reading' },
  { value: '4', label: '4+ skimmable' },
];

/** Real TL;DRs and apply notes from the dev seed; comment digests are invented to show Phase B. */
export const TRIAGE_ITEMS: TriageItem[] = [
  {
    id: '1',
    score: 7,
    type: 'Workflow',
    providers: ['Anthropic', 'Other'],
    ageDays: 2,
    published: 'Aug 14, 2026',
    source: 'Duy Nguyen (mrgoonie)',
    relevant: true,
    promo: false,
    tldr: 'So sánh ba kiểu advisor trong agentic workflow: built-in advisor của Claude Code, kongming của AgentKit và AgentKit advisor (hỏi từng câu kiểu interview).',
    applyNote:
      'Đã có trong setup của bạn: /cap gọi một review agent có context riêng trước khi commit. Cái mới là đặt checkpoint tư vấn **trước khi quyết định** (kiến trúc, go/no-go), không chỉ review sau khi code xong.',
    text: 'Chi tiết & rõ ràng ❤️\n\nLý do tại sao Claude Code đã có chế độ "advisor" nhưng AK vẫn phải chế độ thêm ông Gia Cát Lượng (Khổng Minh) và flag "--advice"...',
    images: [],
    links: [{ host: 'facebook.com', summary: null }],
    comments: {
      count: 23,
      digest:
        'Hai người hỏi advisor có tốn thêm token không; tác giả trả lời: có, khoảng 10-15% mỗi checkpoint. Một người phản biện rằng plan mode của Claude Code đã đủ cho task nhỏ.',
      links: ['github.com/agentkit/docs/advisor'],
    },
    status: 'inbox',
  },
  {
    id: '2',
    score: 6,
    type: 'News',
    providers: ['Open source'],
    ageDays: 3,
    published: 'Aug 13, 2026',
    source: 'Duy Nguyen (mrgoonie)',
    relevant: true,
    promo: false,
    tldr: 'Qwen3.8-27B ra open weights, benchmark do Qwen công bố vượt Qwen3.7-Plus và nhiều mục vượt Opus 4.6 Max, chạy local được qua HuggingFace.',
    applyNote:
      'Không thay Claude Code (Opus) trong workflow hằng ngày của bạn. Đáng ghi nhận khi chọn công cụ cho team: model 27B open weights chạy local hoặc self-host.',
    text: 'Qwen3.8-27B vừa ra, open weights, benchmark khá ấn tượng...',
    images: [
      { label: 'Benchmark table', ratio: '590 / 553' },
      { label: 'Benchmark chart', ratio: '590 / 332' },
    ],
    links: [
      {
        host: 'huggingface.co',
        summary: 'Model card: 27B dense, Apache 2.0, 128K context. Benchmark table là số do Qwen tự công bố.',
      },
    ],
    comments: {
      count: 37,
      digest: 'Phần lớn là khen. Một người chạy thử trên M3 Max 64GB: khoảng 18 token/s ở Q4.',
      links: [],
    },
    status: 'inbox',
  },
  {
    id: '3',
    score: 6,
    type: 'Workflow',
    providers: ['Anthropic', 'Other'],
    ageDays: 4,
    published: 'Aug 12, 2026',
    source: 'Duy Nguyen (mrgoonie)',
    relevant: true,
    promo: false,
    tldr: 'Chạy Claude Code trên Cloud Environment của Claude, cài AgentKit qua setup script để có lại bộ công cụ quen thuộc, chạy được nhiều session song song.',
    applyNote: 'Đáng thử khi cần chạy nhiều session song song mà không tốn RAM máy local.',
    text: 'Mình chuyển hẳn sang chạy Claude Code trên cloud...',
    images: [{ label: 'Setup script screenshot', ratio: '791 / 540' }],
    links: [],
    comments: null,
    status: 'inbox',
  },
  {
    id: '4',
    score: 5,
    type: 'Tool',
    providers: ['Anthropic'],
    ageDays: 5,
    published: 'Aug 11, 2026',
    source: 'Duy Nguyen (mrgoonie)',
    relevant: true,
    promo: false,
    tldr: 'Claude Code có tùy chọn tự chờ khi chạm usage limit rồi chạy tiếp, thay vì dừng session.',
    applyNote: 'Bật thử cho các session dài chạy qua đêm; tác giả không ghi tên setting, cần tra changelog.',
    text: 'Tip nhỏ: Claude Code giờ có thể tự chờ khi hết limit...',
    images: [],
    links: [],
    comments: {
      count: 12,
      digest: 'Tên setting nằm trong comment của tác giả.',
      links: ['docs.claude.com/claude-code/settings'],
    },
    status: 'inbox',
  },
  {
    id: '5',
    score: 3,
    type: 'News',
    providers: ['DeepSeek'],
    ageDays: 5,
    published: 'Aug 11, 2026',
    source: 'Duy Nguyen (mrgoonie)',
    relevant: false,
    promo: false,
    tldr: 'Ước tính chi phí 10 tỷ tokens DeepSeek theo giá cũ không cache: khoảng $4,350 nếu toàn input, $8,700 nếu toàn output.',
    applyNote: 'Không cần làm gì. Chỉ hữu ích như một mốc giá khi bạn so sánh model và chi phí cho team.',
    text: '10 tỷ tokens thì tốn bao nhiêu tiền?...',
    images: [{ label: 'Pricing screenshot', ratio: '590 / 253' }],
    links: [{ host: 'api-docs.deepseek.com', summary: 'Trang pricing hiện tại: giá đã giảm, có cache discount.' }],
    comments: null,
    status: 'inbox',
  },
  {
    id: '6',
    score: 2,
    type: 'Opinion',
    providers: ['Other'],
    ageDays: 6,
    published: 'Aug 10, 2026',
    source: 'Duy Nguyen (mrgoonie)',
    relevant: false,
    promo: true,
    tldr: 'Câu chuyện một học viên từ không biết code sau một năm tự build hệ thống agents, giới thiệu làm tutor.',
    applyNote: null,
    text: 'Một năm trước bạn ấy chưa biết code là gì...',
    images: [],
    links: [],
    comments: null,
    status: 'inbox',
  },
  {
    id: '7',
    score: null,
    type: '',
    providers: [],
    ageDays: 7,
    published: 'Aug 9, 2026',
    source: 'Duy Nguyen (mrgoonie)',
    relevant: false,
    promo: false,
    tldr: 'ai chà... 👀',
    applyNote: null,
    text: 'ai chà... 👀',
    images: [{ label: 'Slide', ratio: '548 / 590' }],
    links: [],
    comments: null,
    status: 'inbox',
  },
];
