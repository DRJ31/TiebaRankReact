import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, DatePicker, Drawer, Input, message, Modal, Select, Spin, Table, Typography } from "antd";
import { CrownFilled, InfoCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import axios from "axios";
import Swal from "sweetalert2";
import encrypt from "../encrypt";

dayjs.extend(weekday);
dayjs.extend(localeData);

const { Search } = Input;
const { Text, Paragraph } = Typography;
const { Option } = Select;

const SearchDrawer = (props) => {
  // States
  const [keyword, setKeyword] = useState("");
  const [anniversary, setAnniversary] = useState("20200928");
  const [drawer, setDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventDate, setEventDate] = useState(dayjs());
  const [visible, setVisible] = useState(false);
  const [userInfo, setUserInfo] = useState({
    link: '',
    title: '',
    text: ''
  });

  // Constants
  const cols = [
    {
      title: '事件',
      dataIndex: 'event',
      render: (text, record) => (
        <Button type="text"
                onClick={() => Modal.info({ title: text, content: record.description })}
        >{text}<InfoCircleOutlined style={{ color: "#3fc3ee" }}/></Button>
      )
    },
    {
      title: '日期',
      dataIndex: 'date',
      render: (text) => `${dayjs(text).format("YYYY年MM月DD日")}`
    },
    {
      title: '描述',
      dataIndex: 'date',
      render: (text, record) => `已${record.adj}${eventDate.diff(dayjs(text), "days") + 1}天`
    }
  ];

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank'
    },
    {
      title: '吧友',
      dataIndex: 'name',
      render: (text, record) => (
        <Button type="text" onClick={() => {
          setLoading(true);
          axios.post('https://app.drjchn.com/api/v2/tieba/user', {
            link: record.link,
            token: encrypt(record.link)
          }).then(rsp => {
            const nickname = rsp.data.user.nickname;
            setUserInfo({
              link: rsp.data.user.avatar,
              title: !record.member ? nickname :
                '<span><i aria-label="icon: crown" class="anticon anticon-crown" style="color: rgb(255, 197, 61);"><svg viewBox="64 64 896 896" focusable="false" class="" data-icon="crown" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M899.6 276.5L705 396.4 518.4 147.5a8.06 8.06 0 0 0-12.9 0L319 396.4 124.3 276.5c-5.7-3.5-13.1 1.2-12.2 7.9L188.5 865c1.1 7.9 7.9 14 16 14h615.1c8 0 14.9-6 15.9-14l76.4-580.6c.8-6.7-6.5-11.4-12.3-7.9zM512 734.2c-62.1 0-112.6-50.5-112.6-112.6S449.9 509 512 509s112.6 50.5 112.6 112.6S574.1 734.2 512 734.2zm0-160.9c-26.6 0-48.2 21.6-48.2 48.3 0 26.6 21.6 48.3 48.2 48.3s48.2-21.6 48.2-48.3c0-26.6-21.6-48.3-48.2-48.3z"></path></svg></i> <span class="ant-typography ant-typography-danger">' + nickname + '</span></span>',
              text: text
            });
            setLoading(false);
          }).catch(err => {
            console.log(err);
            message.error("该用户不存在");
            setLoading(false);
          });
        }}>
          {!record.member ? (record.nickname ? record.nickname : text) : (
            <span><CrownFilled style={{ color: '#ffc53d' }}/> <Text
              type='danger'>{record.nickname ? record.nickname : text}</Text></span>
          )}
        </Button>
      )
    },
    {
      title: '等级',
      dataIndex: 'level'
    },
    {
      title: '经验值',
      dataIndex: 'exp'
    }
  ];

  // Functions
  const handleDayChange = (date, dateString) => {
    if (date < dayjs(anniversary)) {
      setAnniversary("20190621");
    }
    setEventDate(date);
    axios.get('https://app.drjchn.com/api/v2/tieba/event', {
      params: {
        date: dateString,
        token: encrypt(dateString)
      }
    }).then(res => {
      const evs = res.data.event.length > 0 ? res.data.event : ["无"];
      setEvents(evs);
    });
  };

  const handleSearch = kw => {
    if (kw.length === 0) {
      setSearchData([]);
      return;
    }
    setLoading(true);
    axios.get('https://app.drjchn.com/api/v2/tieba/user', {
      params: {
        keyword: kw,
        token: encrypt(kw)
      }
    }).then(rsp => {
      setSearchData(rsp.data.users);
      setKeyword(kw);
      setLoading(false);
    }).catch(err => {
      console.log(err);
      setLoading(false);
      message.error("搜索用户信息失败");
    });
  };

  // Use effect
  useEffect(() => {
    const today = dayjs().format("YYYY-MM-DD");
    axios.get('https://app.drjchn.com/api/v2/tieba/event', {
      params: {
        date: today,
        token: encrypt(today)
      }
    }).then(res => {
      const evs = res.data.event.length > 0 ? res.data.event : ["无"];
      setEvents(evs);
    });
  }, []);

  useEffect(() => {
    if (userInfo.link.length > 0) {
      Swal.fire({
        imageUrl: userInfo.link,
        title: userInfo.title,
        text: userInfo.text
      });
    }
  }, [userInfo]);

  const isInitial = useRef(true);
  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    setVisible(true);
  }, [props.trigger]);

  return (
    <Drawer
      title="搜索"
      placement="right"
      width={window.outerWidth > 520 ? 500 : window.outerWidth}
      onClose={() => setVisible(false)}
      open={visible}
      style={{ textAlign: 'center' }}
    >
      <Drawer
        title="黑暗史记"
        placement="right"
        width={window.outerWidth > 520 ? 500 : window.outerWidth}
        onClose={() => setDrawer(false)}
        open={drawer}
        style={{ textAlign: 'center' }}
      >
        <Table columns={cols} dataSource={props.anniversaries} rowKey='event'/>
      </Drawer>
      <Search
        placeholder='搜索用户'
        value={keyword}
        onChange={e => setKeyword(e.target.value)}
        onSearch={handleSearch}
        allowClear
      />
      <Spin
        tip='加载中...'
        spinning={loading}
        indicator={<LoadingOutlined/>}
      >
        <Table
          dataSource={searchData}
          columns={columns}
          rowKey='rank'
          style={{
            background: '#fff',
            marginTop: 20,
            marginBottom: 40
          }}
        />
      </Spin>
      <Card title="大事件">
        {eventDate >= dayjs('20190621') &&
          <div>
            <Select value={anniversary} style={{ width: 100, marginRight: 10 }}
                    onChange={setAnniversary}>
              {props.anniversaries.map(ann => eventDate >= dayjs(ann.date) && (
                <Option value={ann.date} key={ann.date}>
                  {ann.event.match(/\(/g) ? ann.event.split("(")[0] : ann.event}
                </Option>
              ))}
            </Select>
            <Text>第 {eventDate.diff(dayjs(anniversary), "days") + 1} 天</Text>
            <Button type="primary" style={{ marginLeft: 10 }} onClick={() => setDrawer(true)}>汇总</Button>
          </div>}
        <DatePicker
          style={{ marginBottom: 20, marginTop: 20 }}
          onChange={handleDayChange}
          value={eventDate}
          allowClear={false}
          placeholder="选择日期"
          cellRender={current => {
            const days = props.days;
            const style = {};
            if (days.indexOf(current.format("YYYY-MM-DD")) !== -1) {
              style.border = '1px solid #1677ff';
              style.borderRadius = '50%';
            }
            return (
              <div className="ant-picker-cell-inner" style={style}>
                {current.date()}
              </div>
            );
          }}
        />
        {events.length === 1 ? <Paragraph>{events[0]}</Paragraph> :
          events.map((val, i) => (
            <Paragraph key={"event" + i}>{i + 1}. {val}</Paragraph>
          ))}
      </Card>
    </Drawer>
  )
};

export default SearchDrawer;
