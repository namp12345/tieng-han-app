const PHRASE_TOPICS = [
  {
    id: 'chao-hoi',
    name: 'Chào hỏi khách',
    phrases: [
      {
        id: 'hello',
        ko: '안녕하세요',
        vi: 'Xin chào quý khách.',
        roman: 'an-nyeong-ha-se-yo',
        breakdown: '안녕 (bình an) + 하세요 (kính ngữ)',
        root: '安寧',
        note: 'Hán Hàn · câu chào lịch sự chuẩn nhất.'
      },
      {
        id: 'nice-meet',
        ko: '반갑습니다',
        vi: 'Rất vui được gặp quý khách.',
        roman: 'ban-gap-seum-ni-da',
        breakdown: '반갑다 (vui mừng) + 습니다 (kính ngữ)',
        note: 'Thuần Hàn.'
      },
      {
        id: 'take-care',
        ko: '잘 부탁드립니다',
        vi: 'Mong quý khách hỗ trợ và đồng hành cùng tôi.',
        roman: 'jal bu-tak-deu-rim-ni-da',
        breakdown: '잘 (tốt) + 부탁 (nhờ cậy) + 드립니다 (kính gửi)',
        root: '付託',
        note: 'Hán Hàn · dùng sau khi tự giới thiệu.'
      }
    ]
  },
  {
    id: 'san-bay',
    name: 'Đón khách ở sân bay',
    phrases: [
      {
        id: 'airport-sign',
        ko: '저는 다낭 투어 가이드입니다',
        vi: 'Tôi là hướng dẫn viên tour Đà Nẵng.',
        roman: 'jeo-neun da-nang tu-eo ga-i-deu-im-ni-da',
        breakdown: '저는 (tôi) + 가이드입니다 (là hướng dẫn viên)',
        note: 'Borrowed + Hán Hàn.'
      },
      {
        id: 'passport',
        ko: '여권을 보여 주세요',
        vi: 'Vui lòng cho tôi kiểm tra hộ chiếu.',
        roman: 'yeo-gwon-eul bo-yeo ju-se-yo',
        breakdown: '여권 (hộ chiếu) + 보여 주세요 (xin cho xem)',
        root: '旅券',
        note: 'Hán Hàn.'
      },
      {
        id: 'luggage-here',
        ko: '짐은 여기 두세요',
        vi: 'Xin để hành lý ở đây giúp tôi.',
        roman: 'jim-eun yeo-gi du-se-yo',
        breakdown: '짐 (hành lý) + 여기 (ở đây) + 두세요 (hãy để)',
        note: 'Thuần Hàn.'
      }
    ]
  },
  {
    id: 'lich-trinh',
    name: 'Giới thiệu lịch trình',
    phrases: [
      {
        id: 'today-plan',
        ko: '오늘 일정 안내드리겠습니다',
        vi: 'Tôi xin giới thiệu lịch trình hôm nay.',
        roman: 'o-neul il-jeong an-nae-deu-ri-ge-sseum-ni-da',
        breakdown: '오늘 (hôm nay) + 일정 (lịch trình) + 안내드리겠습니다 (xin giới thiệu)',
        root: '日程 + 案內',
        note: 'Hán Hàn.'
      },
      {
        id: 'first-stop',
        ko: '먼저 바나힐로 이동하겠습니다',
        vi: 'Điểm đầu tiên chúng ta sẽ đi Bà Nà Hills.',
        roman: 'meon-jeo ba-na-hil-lo i-dong-ha-ge-sseum-ni-da',
        breakdown: '먼저 (trước tiên) + 이동하겠습니다 (sẽ di chuyển)',
        root: '移動',
        note: 'Hán Hàn + địa danh.'
      },
      {
        id: 'free-time',
        ko: '자유 시간은 한 시간입니다',
        vi: 'Thời gian tự do là 1 tiếng.',
        roman: 'ja-yu si-gan-eun han si-gan-im-ni-da',
        breakdown: '자유 시간 (thời gian tự do) + 한 시간 (1 giờ)',
        root: '自由 + 時間',
        note: 'Hán Hàn.'
      }
    ]
  },
  {
    id: 'nhac-gio',
    name: 'Nhắc giờ giấc',
    phrases: [
      {
        id: 'meet-time',
        ko: '세 시까지 여기로 와 주세요',
        vi: 'Vui lòng quay lại đây trước 3 giờ.',
        roman: 'se si-kka-ji yeo-gi-ro wa ju-se-yo',
        breakdown: '세 시까지 (đến 3 giờ) + 여기로 (về đây) + 와 주세요 (hãy đến)',
        note: 'Thuần Hàn.'
      },
      {
        id: 'five-min',
        ko: '오 분 후에 출발합니다',
        vi: '5 phút nữa xe sẽ xuất phát.',
        roman: 'o bun hu-e chul-bal-ham-ni-da',
        breakdown: '오 분 후에 (sau 5 phút) + 출발합니다 (xuất phát)',
        root: '出發',
        note: 'Hán Hàn.'
      },
      {
        id: 'be-punctual',
        ko: '시간 꼭 지켜 주세요',
        vi: 'Xin vui lòng đúng giờ giúp tôi.',
        roman: 'si-gan kkok ji-kyeo ju-se-yo',
        breakdown: '시간 (thời gian) + 꼭 (nhất định) + 지켜 주세요 (hãy giữ)',
        note: 'Hán Hàn + Thuần Hàn.'
      }
    ]
  },
  {
    id: 'len-xe',
    name: 'Lên xe / xuống xe',
    phrases: [
      {
        id: 'follow-me',
        ko: '저를 따라오세요',
        vi: 'Mời quý khách đi theo tôi.',
        roman: 'jeo-reul tta-ra-o-se-yo',
        breakdown: '저를 (tôi) + 따라오세요 (hãy đi theo)',
        note: 'Thuần Hàn.'
      },
      {
        id: 'seatbelt',
        ko: '안전벨트를 매 주세요',
        vi: 'Vui lòng thắt dây an toàn.',
        roman: 'an-jeon-bel-teu-reul mae ju-se-yo',
        breakdown: '안전벨트 (dây an toàn) + 매 주세요 (hãy thắt)',
        root: '安全',
        note: 'Hán Hàn + borrowed.'
      },
      {
        id: 'arrived',
        ko: '도착했습니다. 천천히 내리세요',
        vi: 'Chúng ta đến nơi rồi, xin xuống xe từ từ.',
        roman: 'do-chak-haet-seum-ni-da cheon-cheon-hi nae-ri-se-yo',
        breakdown: '도착했습니다 (đã đến) + 내리세요 (hãy xuống)',
        root: '到着',
        note: 'Hán Hàn + Thuần Hàn.'
      }
    ]
  },
  {
    id: 'an-uong',
    name: 'Ăn uống',
    phrases: [
      {
        id: 'enjoy-meal',
        ko: '맛있게 드세요',
        vi: 'Chúc quý khách dùng bữa ngon miệng.',
        roman: 'ma-si-it-ge deu-se-yo',
        breakdown: '맛있게 (ngon) + 드세요 (xin dùng)',
        note: 'Thuần Hàn.'
      },
      {
        id: 'recommend',
        ko: '현지 인기 메뉴를 추천해 드릴게요',
        vi: 'Tôi sẽ gợi ý món địa phương được ưa chuộng.',
        roman: 'hyeon-ji in-gi me-nyu-reul chu-cheon-hae deu-ril-ge-yo',
        breakdown: '현지 (địa phương) + 추천 (đề xuất)',
        root: '現地 + 推薦',
        note: 'Hán Hàn + borrowed.'
      },
      {
        id: 'allergy',
        ko: '알레르기 있으시면 말씀해 주세요',
        vi: 'Nếu có dị ứng thực phẩm, xin báo cho tôi.',
        roman: 'al-le-reu-gi i-syu-si-myeon mal-sseum-hae ju-se-yo',
        breakdown: '알레르기 (dị ứng) + 말씀해 주세요 (xin cho biết)',
        note: 'Borrowed.'
      }
    ]
  },
  {
    id: 'khach-san',
    name: 'Khách sạn',
    phrases: [
      {
        id: 'checkin-help',
        ko: '체크인 도와드리겠습니다',
        vi: 'Tôi sẽ hỗ trợ quý khách làm thủ tục nhận phòng.',
        roman: 'che-keu-in do-wa-deu-ri-ge-sseum-ni-da',
        breakdown: '체크인 (check-in) + 도와드리겠습니다 (xin hỗ trợ)',
        note: 'Borrowed + Thuần Hàn.'
      },
      {
        id: 'breakfast-time',
        ko: '아침 식사는 일곱 시부터입니다',
        vi: 'Bữa sáng bắt đầu từ 7 giờ.',
        roman: 'a-chim sik-sa-neun il-gop si-bu-teo-im-ni-da',
        breakdown: '아침 식사 (bữa sáng) + 일곱 시부터 (từ 7 giờ)',
        root: '食事',
        note: 'Hán Hàn.'
      },
      {
        id: 'key-card',
        ko: '객실 키카드는 꼭 챙겨 주세요',
        vi: 'Xin nhớ luôn mang theo thẻ phòng.',
        roman: 'gaek-sil ki-ka-deu-neun kkok chaeng-gyeo ju-se-yo',
        breakdown: '객실 (phòng khách) + 키카드 (thẻ khóa) + 챙겨 주세요 (hãy mang theo)',
        root: '客室',
        note: 'Hán Hàn + borrowed.'
      }
    ]
  },
  {
    id: 'hoi-an',
    name: 'Tham quan Hội An',
    phrases: [
      {
        id: 'hoian-intro',
        ko: '여기는 호이안 올드타운입니다',
        vi: 'Đây là phố cổ Hội An.',
        roman: 'yeo-gi-neun ho-i-an ol-deu-ta-un-im-ni-da',
        breakdown: '여기는 (đây là) + 올드타운 (phố cổ)',
        note: 'Thuần Hàn + borrowed.'
      },
      {
        id: 'lantern-photo',
        ko: '등불이 예뻐서 사진이 잘 나와요',
        vi: 'Đèn lồng rất đẹp nên chụp ảnh lên rất xinh.',
        roman: 'deung-bul-i ye-ppeo-seo sa-jin-i jal na-wa-yo',
        breakdown: '등불 (đèn) + 사진 (ảnh) + 잘 나와요 (lên hình đẹp)',
        root: '寫眞',
        note: 'Hán Hàn + Thuần Hàn.'
      },
      {
        id: 'boat-option',
        ko: '소원배 체험 원하시면 말씀해 주세요',
        vi: 'Nếu muốn trải nghiệm thả hoa đăng bằng thuyền, xin báo tôi.',
        roman: 'so-won-bae che-heom won-ha-si-myeon mal-sseum-hae ju-se-yo',
        breakdown: '체험 (trải nghiệm) + 원하시면 (nếu muốn)',
        root: '體驗',
        note: 'Hán Hàn.'
      }
    ]
  },
  {
    id: 'bana',
    name: 'Bà Nà Hills',
    phrases: [
      {
        id: 'cable-car',
        ko: '케이블카 탑승 전에 표를 확인해 주세요',
        vi: 'Trước khi lên cáp treo, vui lòng kiểm tra vé.',
        roman: 'ke-i-beul-ka tap-seung jeon-e pyo-reul hwa-gin-hae ju-se-yo',
        breakdown: '케이블카 (cáp treo) + 탑승 (lên) + 확인 (kiểm tra)',
        root: '搭乘 + 確認',
        note: 'Hán Hàn + borrowed.'
      },
      {
        id: 'golden-bridge',
        ko: '골든브릿지에서 십오 분 자유시간 드릴게요',
        vi: 'Tôi cho quý khách 15 phút tự do tại Cầu Vàng.',
        roman: 'gol-deun-beu-rit-ji-e-seo sip-o bun ja-yu-si-gan deu-ril-ge-yo',
        breakdown: '십오 분 (15 phút) + 자유시간 (thời gian tự do)',
        root: '自由時間',
        note: 'Hán Hàn + borrowed.'
      },
      {
        id: 'weather-jacket',
        ko: '산 위는 추우니 겉옷을 챙기세요',
        vi: 'Trên núi lạnh hơn, quý khách nhớ mang áo khoác.',
        roman: 'san wi-neun chu-u-ni geod-o-seul chaeng-gi-se-yo',
        breakdown: '산 위 (trên núi) + 추우니 (vì lạnh) + 챙기세요 (hãy mang)',
        note: 'Thuần Hàn.'
      }
    ]
  },
  {
    id: 'linh-ung',
    name: 'Chùa Linh Ứng',
    phrases: [
      {
        id: 'temple-respect',
        ko: '사찰에서는 조용히 해 주세요',
        vi: 'Trong chùa, xin giữ yên lặng.',
        roman: 'sa-chal-e-seo-neun jo-yong-hi hae ju-se-yo',
        breakdown: '사찰 (chùa) + 조용히 (yên lặng) + 해 주세요 (hãy giữ)',
        root: '寺刹',
        note: 'Hán Hàn.'
      },
      {
        id: 'dress-code',
        ko: '노출이 심한 옷은 피해주세요',
        vi: 'Xin tránh mặc trang phục hở hang.',
        roman: 'no-chul-i sim-han o-seun pi-hae-ju-se-yo',
        breakdown: '노출 (hở) + 옷 (quần áo) + 피해주세요 (xin tránh)',
        root: '露出',
        note: 'Hán Hàn + Thuần Hàn.'
      },
      {
        id: 'photo-zone',
        ko: '사진은 지정된 곳에서 찍어 주세요',
        vi: 'Vui lòng chụp ảnh ở khu vực được phép.',
        roman: 'sa-jin-eun ji-jeong-doen go-seo jji-geo ju-se-yo',
        breakdown: '사진 (ảnh) + 지정된 곳 (nơi được chỉ định) + 찍어 주세요 (hãy chụp)',
        root: '寫眞 + 指定',
        note: 'Hán Hàn.'
      }
    ]
  },
  {
    id: 'mua-sam',
    name: 'Mua sắm',
    phrases: [
      {
        id: 'trusted-shop',
        ko: '믿을 수 있는 상점으로 안내하겠습니다',
        vi: 'Tôi sẽ dẫn quý khách đến cửa hàng uy tín.',
        roman: 'mi-deul su it-neun sang-jeom-eu-ro an-nae-ha-ge-sseum-ni-da',
        breakdown: '상점 (cửa hàng) + 안내하겠습니다 (sẽ hướng dẫn)',
        root: '商店 + 案內',
        note: 'Hán Hàn.'
      },
      {
        id: 'check-price',
        ko: '가격표를 먼저 확인해 주세요',
        vi: 'Xin kiểm tra bảng giá trước khi mua.',
        roman: 'ga-gyeok-pyo-reul meon-jeo hwa-gin-hae ju-se-yo',
        breakdown: '가격표 (bảng giá) + 확인해 주세요 (hãy kiểm tra)',
        root: '價格表 + 確認',
        note: 'Hán Hàn.'
      },
      {
        id: 'receipt',
        ko: '영수증은 꼭 보관해 주세요',
        vi: 'Xin giữ lại hóa đơn để tiện hỗ trợ.',
        roman: 'yeong-su-jeung-eun kkok bo-gwan-hae ju-se-yo',
        breakdown: '영수증 (hóa đơn) + 보관해 주세요 (hãy giữ)',
        root: '領收證 + 保管',
        note: 'Hán Hàn.'
      }
    ]
  },
  {
    id: 'tinh-huong',
    name: 'Xử lý tình huống',
    phrases: [
      {
        id: 'lost-person',
        ko: '일행을 놓치셨으면 바로 연락 주세요',
        vi: 'Nếu bị lạc đoàn, vui lòng liên hệ tôi ngay.',
        roman: 'il-haeng-eul no-chi-syeo-sseu-myeon ba-ro yeon-rak ju-se-yo',
        breakdown: '일행 (đoàn) + 연락 주세요 (hãy liên hệ)',
        root: '一行 + 連絡',
        note: 'Hán Hàn.'
      },
      {
        id: 'hospital-help',
        ko: '몸이 불편하시면 병원으로 안내하겠습니다',
        vi: 'Nếu không khỏe, tôi sẽ hỗ trợ đưa đi bệnh viện.',
        roman: 'mo-mi bul-pyeon-ha-si-myeon byeong-won-eu-ro an-nae-ha-ge-sseum-ni-da',
        breakdown: '불편하시면 (nếu không thoải mái) + 병원 (bệnh viện)',
        root: '病院 + 案內',
        note: 'Hán Hàn.'
      },
      {
        id: 'emergency',
        ko: '긴급 상황이면 지금 119에 신고하겠습니다',
        vi: 'Nếu khẩn cấp, tôi sẽ gọi 119 ngay bây giờ.',
        roman: 'gin-geup sang-hwang-i-myeon ji-geum il-il-gu-e sin-go-ha-ge-sseum-ni-da',
        breakdown: '긴급 상황 (tình huống khẩn cấp) + 신고하겠습니다 (tôi sẽ báo)',
        root: '緊急 + 狀況 + 申告',
        note: 'Hán Hàn.'
      }
    ]
  },
  {
    id: 'tam-biet',
    name: 'Tạm biệt khách',
    phrases: [
      {
        id: 'thanks-today',
        ko: '오늘 함께해 주셔서 감사합니다',
        vi: 'Cảm ơn quý khách đã đồng hành hôm nay.',
        roman: 'o-neul ham-kke-hae ju-syeo-seo gam-sa-ham-ni-da',
        breakdown: '오늘 (hôm nay) + 함께해 주셔서 (vì đã cùng đi) + 감사합니다 (cảm ơn)',
        root: '感謝',
        note: 'Hán Hàn.'
      },
      {
        id: 'safe-return',
        ko: '한국까지 편안하게 돌아가세요',
        vi: 'Chúc quý khách trở về Hàn Quốc an toàn.',
        roman: 'han-guk-kka-ji pyeon-an-ha-ge do-ra-ga-se-yo',
        breakdown: '편안하게 (thoải mái) + 돌아가세요 (xin quay về)',
        note: 'Thuần Hàn + Hán Hàn.'
      },
      {
        id: 'see-you-again',
        ko: '다음에 또 뵙겠습니다',
        vi: 'Hẹn gặp lại quý khách lần sau.',
        roman: 'da-eum-e tto boep-get-seum-ni-da',
        breakdown: '다음에 (lần sau) + 또 (lại) + 뵙겠습니다 (sẽ gặp)',
        note: 'Thuần Hàn.'
      }
    ]
  }
];
