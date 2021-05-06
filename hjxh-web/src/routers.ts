export interface RouterItem {
  key: string;
  title: string;
  icon?: string;
  children?: RouterItem[];
}

export const routers: RouterItem[] =[
  {
    key: "home",
    title: "首页",
    icon: 'icon-shouye',
  },
  {
    key: "analysis",
    title: "聚合分析",
    icon: 'icon-zhujijuhe',
    children: [
      {
        key: "analysis_orders",
        title: "订单分析",
      },
      {
        key: "analysis_ad",
        title: "推广分析",
      },
    ],
  },
  {
    key: "raw",
    title: "原始数据",
    icon: 'icon-jurassic_data',
    children: [
      {
        key: "raw_orders",
        title: "订单查询",
      },
      {
        key: "raw_ad_search",
        title: "多多推广",
      },
      {
        key: "raw_ad_scene",
        title: "多多场景",
      },
      {
        key: "raw_ad_fangxin",
        title: "放心推",
      },
      {
        key: 'raw_goods_detail',
        title: '商品明细'
      },
      {
        key: 'raw_goods_comments',
        title: '商品评价'
      }
    ],
  },
  {
    key: 'site',
    title: '平台相关',
    icon: 'icon-pingtaiyilan',
    children: [
      {
        key: 'site_users',
        title: '店铺管理',
      }
    ]
  }
];

export default routers;
