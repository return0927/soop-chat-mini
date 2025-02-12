export type PlayerLiveApiResponse = {
  CHANNEL: {
    CHDOMAIN: string;
    CHPT: string;
    CHATNO: string;
    BJID: string;
    BJNICK: string;
    TITLE: string;
    CATE: string;
    CATEGORY_TAGS: string[];
  };
};

export type SignatureEmoticonEntry = {
  title: string;
  tier_type: number;
  pc_img: string;
  mobile_img: string;
  pc_alt_img?: string;
  mobile_alt_img?: string;
  move_img: 'Y' | 'N';
  black_keyword: 'Y' | 'N';
};

export type SignatureEmoticonResponse = {
  img_path: string;
  black_version: string;
  result: number;
  tier_type: number;
  version: number;
  data: {
    tier1?: SignatureEmoticonEntry[];
    tier2?: SignatureEmoticonEntry[];
  };
};
