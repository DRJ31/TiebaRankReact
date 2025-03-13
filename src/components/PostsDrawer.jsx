import React, { useEffect, useRef, useState } from "react";
import { DatePicker, Divider, Drawer, Statistic, Switch, Table, Typography } from "antd";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import { Line } from "@ant-design/plots";
import axios from "axios";
import NProgress from 'nprogress';
import encrypt from "../encrypt";

dayjs.extend(weekday);
dayjs.extend(localeData);

const { Text, Title } = Typography;

const PostsDrawer = (props) => {
  // States
  const [detail, setDetail] = useState(false);
  const [range, setRange] = useState({ start: 1, end: 8 });
  const [drawer, setDrawer] = useState(false);
  const [postData, setPostData] = useState([]);
  const [posts, setPosts] = useState(0);
  const [day, setDay] = useState({
    start: dayjs().subtract(7, "days"),
    end: dayjs().subtract(1, "days")
  });

  // Functions
  const handleDateChange = (date, dateString, category) => {
    const d = day;
    category ? d.start = date : d.end = date;
    setDay(d);
    updateRange(d);
  };

  const updateRange = (d) => {
    const ran = range;
    for (let i = 0; i < postData.length; i++) {
      if (dayjs(postData[i].date).format('YYYY-MM-DD') === dayjs(d.start).format('YYYY-MM-DD')) {
        ran.end = i + 1;
      }
    }
    for (let i = 0; i < postData.length; i++) {
      if (dayjs(postData[i].date).format('YYYY-MM-DD') === dayjs(d.end).format('YYYY-MM-DD')) {
        ran.start = i;
      }
    }
    setRange(ran);
  };

  const getPostsData = () => {
    props.changeLoading(true);
    NProgress.start();
    axios.get('https://app.drjchn.com/api/v2/tieba/post', {
      params: {
        date: dayjs().format('YYYY-MM-DD'),
        token: encrypt(dayjs().format('YYYY-MM-DD'))
      }
    }).then(rsp => {
      const d = day;
      d.end = dayjs().subtract(1, "days");
      d.start = dayjs().subtract(7, "days");
      setPosts(rsp.data.total);
      setDay(d);
      axios.get('https://app.drjchn.com/api/v2/tieba/posts', {
        params: {
          page: 0,
          token: encrypt(0)
        }
      }).then(resp => {
        props.changeLoading(false);
        let data = resp.data.results;
        for (let i = 0; i < data.length - 1; i++) {
          data[i].posts = data[i].total - data[i + 1].total;
          data[i].date = dayjs(data[i].date).valueOf();
        }
        data[data.length - 1].date = dayjs(data[data.length - 1].date).valueOf();
        data[data.length - 1].posts = data[data.length - 1].total;
        const postNow = rsp.data.total - data[0].total;
        data.splice(0, 0, {
          'date': dayjs().valueOf(),
          'total': rsp.data.total,
          'posts': postNow
        });
        NProgress.done();
        setPostData(data);
        setDrawer(true);
      });
    });
  };

  // Constants
  const cols = [
    {
      title: '日期',
      dataIndex: 'date',
      render: text => {
        return dayjs(text).format('YYYY-MM-DD') + '(' + dayjs(text).format('dddd')[2] + ')';
      }
    },
    {
      title: '总帖数',
      dataIndex: 'total',
      render: text => detail ? text : (text / 10000).toFixed(2) + "W"
    },
    {
      title: '当日发帖数',
      dataIndex: 'posts',
      render: text => detail ? text : (text / 10000).toFixed(2) + "W",
      sorter: (a, b) => a.posts - b.posts,
      sortDirections: ['descend', 'ascend']
    }
  ];

  const lineConfig = (yField) => {
    const conf = {
      data: postData.slice(range.start, range.end),
      xField: 'date',
      yField,
      shapeField: 'smooth',
      tooltip: {
        title: (d) => dayjs(d.date).format('YYYY-MM-DD'),
        items: [{ name: "发帖总数", channel: "y" }]
      },
      axis: {
        x: {
          labelFormatter: (datum) => dayjs(datum).format('YY-MM-DD'),
          labelAutoRotate: false,
        },
        y: {
          labelFormatter: (datum) => detail ? datum : (datum / 10000) + "W"
        }
      },
      interaction: {
        tooltip: {
          marker: false,
        },
      },
      style: {
        lineWidth: 2,
      },
    }
    if (yField === "posts") {
      conf["scale"] = {
        y: {
          domainMin: 0
        }
      }
      conf["tooltip"]["items"] = [{ name: "单日发帖总数", channel: "y" }]
    }
    return conf;
  };

  // Use effect
  const isInitial = useRef(true);
  useEffect(() => {
    if (isInitial.current) {
      if (props.trigger) {
        isInitial.current = false;
        getPostsData();
      }
      return;
    }
    getPostsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.trigger]);

  return (
    <Drawer
      title="发帖统计"
      placement="right"
      width={window.outerWidth > 520 ? 500 : window.outerWidth}
      onClose={() => {
        const ran = range;
        ran.start = 1
        ran.end = 8
        setDrawer(false);
        setRange(ran);
      }}
      open={drawer}
      style={{ textAlign: 'center' }}
    >
      <Text style={{ marginRight: 10 }}>详细数据</Text>
      <Switch checked={detail} onChange={() => setDetail(!detail)}/>
      <Divider/>
      <Statistic
        title='总发帖数'
        value={posts}
        style={{ marginTop: 10 }}
        formatter={value => detail ? value : (value / 10000).toFixed(2) + "W"}
      />
      <Divider/>
      <Title level={3}>发帖统计图表</Title>
      <DatePicker
        onChange={((date, dateString) => handleDateChange(date, dateString, true))}
        value={day.start}
        allowClear={false}
        placeholder="选择起始日期"
        disabledDate={current => current < dayjs('20191106') || current >= day.end}
      />
      <DatePicker
        style={{ marginBottom: 20 }}
        onChange={(date, dateString) => handleDateChange(date, dateString, false)}
        value={day.end}
        allowClear={false}
        placeholder="选择结束日期"
        disabledDate={current => current < dayjs('20191106') || current > dayjs() || (current <= day.start)}
      />
      <Title level={4}>发帖总数趋势</Title>
      <Line {...lineConfig("total")} />
      <Title level={4}>单日发帖趋势</Title>
      <Line {...lineConfig("posts")} />
      <Divider/>
      <Title level={4}>发帖数据记录</Title>
      <Table
        dataSource={postData}
        columns={cols}
        rowKey='date'
      />
    </Drawer>
  );
};

export default PostsDrawer;
