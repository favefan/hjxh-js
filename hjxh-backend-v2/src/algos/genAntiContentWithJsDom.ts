import {JSDOM, CookieJar} from 'jsdom'
import {DEFAULT_USER_AGENT} from "../../../hjxh-frontend/src/const";
import { PddBaseType } from "../config/const";


export const genAntiContentJsDom = (cookieJar: CookieJar) => {
  const userAgent = DEFAULT_USER_AGENT
  const {window} = new JSDOM('', {
    url: PddBaseType.home,
    cookieJar,
    userAgent,
    pretendToBeVisual: true
  })

  JSDOM.fromURL('https://yingxiao.pinduoduo.com/marketing/main/center/search/list', {
    // cookieJar,
    userAgent,
    pretendToBeVisual: true
  }).then(dom => {
    dom.serialize()
    console.log('sss')
  })

  // const antiContent = algo(window)
  // console.log('antiContent: ', antiContent)
  // return antiContent
}

export default genAntiContentJsDom


if (require.main === module) {
  const cookieJar = new CookieJar()
  const cookies =
    '// Semicolon separated Cookie File\n' +
    '// This file was generated by EditThisCookie\n' +
    '// Details: http://www.cookiecentral.com/faq/#3.5\n' +
    '// Example: http://www.tutorialspoint.com/javascript/javascript_cookies.htm\n' +
    'Set-Cookie3: _a42=d45329b8-d2cc-4c6a-8ccd-6b4f95214aee; path="/"; domain=.pinduoduo.com; path_spec; expires="1652367873.026012"; version=0\n' +
    'Set-Cookie3: _bee=TTLP5ZyhUEFqloUMXbFUGktM14BIi0fH; path="/"; domain=.pinduoduo.com; path_spec; expires="1652367873.025955"; version=0\n' +
    'Set-Cookie3: _crr=TTLP5ZyhUEFqloUMXbFUGktM14BIi0fH; path="/"; domain=.pinduoduo.com; path_spec; expires="1652367873.025896"; version=0\n' +
    'Set-Cookie3: _f77=19ba6519-2a61-462e-b916-66f754523693; path="/"; domain=.pinduoduo.com; path_spec; expires="1652367873.025986"; version=0\n' +
    'Set-Cookie3: api_uid=rBRmd2Cb2ldT6D62wuUuAg==; path="/"; domain=.pinduoduo.com; path_spec; expires="2145916555.611747"; version=0\n' +
    'Set-Cookie3: rcgk=TTLP5ZyhUEFqloUMXbFUGktM14BIi0fH; path="/"; domain=.pinduoduo.com; path_spec; expires="1652367873.026034"; version=0\n' +
    'Set-Cookie3: rckk=TTLP5ZyhUEFqloUMXbFUGktM14BIi0fH; path="/"; domain=.pinduoduo.com; path_spec; expires="1652367873.026075"; version=0\n' +
    'Set-Cookie3: ru1k=19ba6519-2a61-462e-b916-66f754523693; path="/"; domain=.pinduoduo.com; path_spec; expires="1652367873.026112"; version=0\n' +
    'Set-Cookie3: ru2k=d45329b8-d2cc-4c6a-8ccd-6b4f95214aee; path="/"; domain=.pinduoduo.com; path_spec; expires="1652367873.026147"; version=0\n' +
    'Set-Cookie3: _nano_fp=XpExX0Cxn5maXqXbXo_0dkZ_s2MZcNzZ8q93xYT3; path="/"; domain=mms.pinduoduo.com; path_spec; expires="2484740313"; version=0\n' +
    'Set-Cookie3: JSESSIONID=CB44F338A7E4BCE169F2CE93FFEE5B9C; path="/"; domain=mms.pinduoduo.com; path_spec; expires="0"; version=0\n' +
    'Set-Cookie3: mms_b84d1838=120,3397,3432,1202,1203,1204,1205; path="/"; domain=mms.pinduoduo.com; path_spec; expires="1629508300.992842"; version=0\n' +
    'Set-Cookie3: PASS_ID=1-xftBlN6rzjxriLzYO2HumFtQPzjAfMJY7tQLzsfHU3XpeeSybfXlX4PPAcfgso/7OnGeV4Jn/TCYtuJcpNDkkQ_506673970_93917892; path="/"; domain=mms.pinduoduo.com; path_spec; expires="1621129954.106034"; version=0\n' +
    'Set-Cookie3: x-visit-time=1620868300296; path="/"; domain=mms.pinduoduo.com; path_spec; expires="1629508300.296949"; version=0\n';

    (cookies.match(/(?<=Set-Cookie3: ).*?(?=\n)/g) as string[])
    .forEach((cookie: string) => {
      cookieJar.setCookieSync(cookie, PddBaseType.home)
    })
  genAntiContentJsDom(cookieJar)
}
