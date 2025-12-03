// Các cấp độ thành thạo tiếng Anh
export const PROFICIENCY_LEVELS = [
  {
    id: 1,
    name: "Mới bắt đầu",
    description:
      "Bạn đang làm quen với những từ vựng, mẫu câu rất đơn giản trong đời sống hằng ngày. Bạn có thể giới thiệu bản thân và hỏi thông tin cơ bản như tên, tuổi, nghề nghiệp, nơi sống. Bạn đọc hiểu được hướng dẫn ngắn, bảng hiệu quen thuộc và viết được vài câu chúc mừng hay ghi chú nhanh.",
  },
  {
    id: 2,
    name: "Cơ bản",
    description:
      "Bạn có thể hiểu các câu và cụm từ quen thuộc về gia đình, mua sắm, công việc, trường lớp. Bạn đối thoại được những chủ đề thường ngày khi đối phương nói chậm và rõ. Bạn mô tả sinh hoạt, nhu cầu cá nhân và viết đoạn văn ngắn kể lại trải nghiệm.",
  },
  {
    id: 3,
    name: "Trung cấp",
    description:
      "Bạn nắm được ý chính trong bài nói hoặc đoạn văn về công việc, học tập, giải trí. Bạn xử lý được đa số tình huống khi du lịch ở nơi dùng tiếng Anh. Bạn trình bày trải nghiệm, kế hoạch và quan điểm đơn giản bằng đoạn văn rõ ràng.",
  },
  {
    id: 4,
    name: "Nâng cao",
    description:
      "Bạn hiểu các bài phát biểu dài hơn và cuộc trò chuyện về chủ đề trừu tượng hoặc chuyên môn quen thuộc. Bạn giao tiếp khá trôi chảy với người bản ngữ và tham gia tranh luận, bảo vệ ý kiến bằng lập luận rõ ràng. Bạn viết được văn bản chi tiết về nhiều chủ đề, sử dụng cấu trúc và từ vựng phức tạp vừa phải.",
  },

] as const;

// Khóa lưu trữ trạng thái đã truy cập các tính năng
export const VISITED_KEYS = {
  chat: "has-visited-chat",
  dictionary: "has-visited-dictionary",
  assignments: "has-visited-assignments",
};


export const CHAT_HISTORY_KEY = "chat-history"; // Khóa lưu trữ lịch sử người dùng
export const CHAT_ACTIVE_CONVERSATION_KEY = "chat-active-conversation-id"; // Khóa lưu trữ cuộc trò chuyện đang hoạt động
export const RECENT_DICTIONARY_SEARCHES_KEY = "recent-dictionary-searches"; // Khóa lưu trữ các tìm kiếm từ điển gần đây
export const ASSIGNMENTS_HISTORY_KEY = "assignments-history"; // Khóa lưu trữ lịch sử bài tập
export const WRITING_HISTORY_KEY = "writing-history"; // Khóa lưu trữ lịch sử viết

// Từ khóa mẫu để sử dụng trong từ điển
export const SAMPLE_DICTIONARY_KEYWORDS = [
  "genuine",
  "outsource",
  "stakeholder",
  "leverage",
  "implementation",
  "initiative",
  "benchmark",
  "sustainable",
  "optimize",
  "spontaneous",
  "tremendous",
  "significant",
  "inevitable",
  "dynamic",
  "crucial",
  "essential",
  "break down",
  "carry out",
  "look up to",
  "take off",
  "look forward to",
  "run into",
  "catch up",
  "stand out",
  "turn down",
  "work out",
  "put up with",
  "set up",
  "hang out",
  "methodology",
  "hypothesis",
  "empirical",
  "paradigm",
  "synthesis",
  "give up",
  "put off",
  "figure out",
  "get along",
  "bring up",
  "paint the town red",
  "call it a day",
  "face the music",
  "facilitate",
  "portfolio",
  "acquisition",
  "revenue",
  "diversify",
  "innovative",
];

// Định nghĩa các tính năng chính của ứng dụng
export const FEATURES = [
  {
    title: "TỪ ĐIỂN",
    englishTitle: "Tra cứu thông minh",
    description:
      "Truy cập định nghĩa, thành ngữ và ví dụ theo ngữ cảnh mỗi khi tra từ.",
    href: "/dictionary",
    gradient: "linear-gradient(135deg, #3b82f6, #22d3ee)",
  },
  {
    title: "TRÒ CHUYỆN",
    englishTitle: "Đối thoại cùng gia sư ảo",
    description:
      "Tương tác với gia sư AI để được hướng dẫn, sửa lỗi và luyện nói tự nhiên.",
    href: "/chat",
    gradient: "linear-gradient(135deg, #f97316, #facc15)",
  },
];
