import axios from "axios";
import assert from "assert";
import db, { dbInsertItemsRobust } from "./db";
import dayjs from "dayjs";
import {
  PddAntiContentParams,
  PddExtraParams,
  PddParams,
  PddResult,
} from "../../hjxh-frontend/src/interface/pdd_base";
import {
  PddUserInfo,
  UserInfo,
} from "../../hjxh-frontend/src/interface/pdd_user_info";
import genAntiContent from "./algos/genAntiContent";
import {
  COLL_GOODS_LIST,
  COLL_USERS,
  DEFAULT_USER_AGENT,
  DEFAULT_USERNAME,
} from "../../hjxh-frontend/src/const";
import {
  REQUEST_GOODS_LIST,
  REQUEST_USER_INFO_WITHOUT_MALL,
} from "../../hjxh-frontend/src/interface/pdd_request/urls";
import {getKeyFromCookie, paddy, preprocessCookie, sleep} from "../../hjxh-frontend/src/utils/functions";

/**
 * 主控函数
 * 获取拼多多指定api的数据
 * 异常处理：直接报错
 *
 * @param api
 * @param extraParams
 * @param cookie
 * @param userAgent
 */
export const fetchPddData = async (
  api: string,
  extraParams: PddExtraParams,
  cookie: string,
  userAgent: string = DEFAULT_USER_AGENT
): Promise<PddResult> => {
  const antiContent: string = genAntiContent(cookie, userAgent);
  const pddAntiContentParams: PddAntiContentParams = {
    crawlerInfo: antiContent,
  };
  const params: PddParams = { ...extraParams, ...pddAntiContentParams };

  try {
    const res = await axios.post(api, params, {
      headers: {
        cookie,
        "Anti-Content": antiContent,
        "User-Agent": userAgent,
      },
      withCredentials: true,
    });
    assert(res.data.success === true, JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (e) {
    console.log({
      cookie,
      antiContent,
      params,
    });
    console.error(e.message);
    throw e;
  }
};

/**
 * 迭代函数
 * 智能解析拼多多需要翻页的api，自动获取所有数据
 * todo 异常处理： 暂无
 * @param url
 * @param extraParams
 * @param cookie
 */
export async function* iterPageFetchPddData(
  url: string,
  extraParams: PddExtraParams,
  cookie: string
) {
  const PAGE_KEYS = [
    "page",
    "pageNum",
    "pageNumber",
    "page_num",
    "page_number",
  ];
  const SIZE_KEYS = ["size", "pageSize", "page_size"];
  const pageKey = PAGE_KEYS.find((k) => extraParams[k] !== undefined);
  const sizeKey = SIZE_KEYS.find((k) => extraParams[k] !== undefined);
  assert(pageKey && sizeKey, "当前参数并非可迭代参数： " + extraParams);

  console.log(
    `start iter fetching ${url}, params: ${JSON.stringify(extraParams)}`
  );
  let cur = ((extraParams[pageKey] as number) - 1) * extraParams[sizeKey];
  let tot = 99999;
  while (cur < tot) {
    const res = await fetchPddData(url, extraParams, cookie);
    assert(
      res.result.total !== undefined,
      "当前返回结果并非可迭代结果: " + res.result
    );
    tot = res.result.total;
    const possibleKeys = Object.keys(res.result).filter((k) =>
      Array.isArray(res.result[k])
    );
    assert(possibleKeys.length === 1, "当前结果中列表信息不匹配" + res.result);
    const data = res.result[possibleKeys[0]];
    cur += data.length;
    console.log(`[${paddy(cur, 4)} / ${paddy(tot, 4)}], fetched from ${url}`);
    yield data;
    extraParams[pageKey] += extraParams[sizeKey];
    await sleep(500);
  }
  console.log(`finished iter fetching from url: ${url}`);
}

/**
 * 通过cookie获取拼多多用户信息
 * 可用于登陆验证
 *
 * @param cookie
 * @param userAgent
 */
export const fetchPddUserInfoFromCookie = async (
  cookie: string,
  userAgent: string = DEFAULT_USER_AGENT
): Promise<PddUserInfo> => {
  cookie = preprocessCookie(cookie);
  const res = await fetchPddData(
    REQUEST_USER_INFO_WITHOUT_MALL,
    {},
    cookie,
    userAgent
  );
  return res.result as PddUserInfo;
};

/**
 * 创建拼多多客户端sdk
 *
 * - 不提供用户名，则随机从数据库选一个
 * - 提供用户名，但不提供其他信息，则指定数据库内查找该用户
 * - 提供用户名、密码和cookie，则新建或更新一个用户
 * @param username
 * @param password
 * @param cookie
 */
export const createPddClient = async (
  username?: string,
  password?: string,
  cookie?: string
): Promise<PddClient> => {
  let userInfo: UserInfo;
  if (username && password && cookie) {
    cookie = preprocessCookie(cookie);
    const pddUserInfo: PddUserInfo = await fetchPddUserInfoFromCookie(cookie);
    userInfo = {
      ...pddUserInfo,
      password,
      cookie,
      verifiedTime: new Date().getTime(),
      verifiedStatus: true,
    };
    db.collection(COLL_USERS)
      .updateOne({ _id: pddUserInfo.id }, { $set: userInfo }, { upsert: true })
      .then((e) => {
        console.log("update users result in db: ", e.result);
      })
      .catch((err) => {
        console.error("update users in db fail: ", err.message);
      });
  } else if (username) {
    userInfo = await db.collection(COLL_USERS).findOne({ username: username });
  } else {
    userInfo = await db.collection(COLL_USERS).findOne({});
  }
  console.log("use pdd client of username: " + userInfo.username);
  return new PddClient(userInfo);
};

/**
 * 拼多多客户端sdk
 */
export class PddClient {
  public userInfo: UserInfo;

  constructor(userInfo: UserInfo) {
    this.userInfo = userInfo;
  }

  public getCookie(key: string) {
    return getKeyFromCookie(this.userInfo.cookie, key);
  }

  public getAntiContent() {
    return genAntiContent(this.userInfo.cookie);
  }

  /**
   * 最底层接口，指定url和参数，获取数据结果
   * 不包括翻页、数据库等支持
   *
   * @param url
   * @param extraParams
   */
  public async fetch(
    url: string,
    extraParams: PddExtraParams
  ): Promise<PddResult> {
    const cookie = this.userInfo.cookie;
    const antiContent: string = genAntiContent(cookie);
    const params: PddParams = { ...extraParams, crawlerInfo: antiContent };
    const res = await axios.post(url, params, {
      headers: {
        cookie,
        "Anti-Content": antiContent,
        "User-Agent": DEFAULT_USER_AGENT,
      },
    });
    assert(res.data.success === true, JSON.stringify(res.data, null, 2));
    return res.data;
  }

  /**
   * 迭代【翻页】获取指定接口的数据（通过检测参数中是否存在pageNum, pageSize等字段）
   *
   * @param url
   * @param extraParams
   */
  public async *iterPagesFetchTargetFunc(
    url: string,
    extraParams: PddExtraParams
  ) {
    yield* iterPageFetchPddData(url, extraParams, this.userInfo.cookie);
  }

  /**
   * 迭代【天数】获取指定接口的数据
   *
   * @param targetFunc
   * @param targetFuncName
   * @param days
   */
  public async iterDaysFetchTargetFunc(
    targetFunc: (pddClient: PddClient, ...args: any) => Promise<boolean>,
    targetFuncName: string,
    days: number = 30
  ) {
    let endDate = dayjs().startOf("day").subtract(1, "day");
    console.log(
      "start init data of " +
        targetFuncName +
        " from " +
        endDate.subtract(days, "days").format("MM-DD") +
        " to " +
        endDate.format("MM-DD")
    );
    let day = 1;
    while (
      (await targetFunc(this, endDate.format("YYYY-MM-DD"))) &&
      days++ < days
    ) {
      console.log(`fetched ${targetFuncName} ( ${day} / ${days} )`);
      endDate = endDate.subtract(1, "day");
    }
    console.log("finished init data of " + targetFuncName);
  }

  public async verifyUser(): Promise<boolean> {
    console.log("verifying users info...");
    let success: boolean = false;
    try {
      const res_user_info = await this.fetch(
        REQUEST_USER_INFO_WITHOUT_MALL,
        {}
      );
      assert(
        res_user_info.result.username === this.userInfo.username,
        "登录失败" + JSON.stringify(res_user_info)
      );
      success = true;
      console.log("verified users info.");
    } catch (e) {
      console.error("FAILED to verify users info, msg: ");
      console.error(e.message);
    }

    await db.collection(COLL_USERS).updateOne(
      { username: this.userInfo.username },
      {
        $set: {
          verifiedStatus: success,
          verifiedTime: new Date(),
        },
      }
    );
    return success;
  }

  public async fetchGoodsList() {
    console.log("fetching goods list...");
    const iter = await this.iterPagesFetchTargetFunc(REQUEST_GOODS_LIST, {
      page: 1,
      size: 50,
    });
    while (true) {
      const res = await iter.next();
      if (res.done) break;
      if (!(await dbInsertItemsRobust(COLL_GOODS_LIST, res.value, this, "id")))
        break;
    }
    console.log("fetched goods list.");
  }

  public async initAllData() {
    //  verify users info
    if (!(await this.verifyUser())) return;

    //  fetch goods list
    await this.fetchGoodsList();

    //  fetch goods detail

    //  fetch goods comments history

    //  fetch orders

    //  fetch ad search, ad scene

    //  fetch ad fangxin
  }
}

if (require.main === module) {
  createPddClient(DEFAULT_USERNAME).then((pddClient) => {
    pddClient.verifyUser();
    // pddClient.initAllData();
  });
}
