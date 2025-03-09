import React, { useEffect, useState } from 'react';
import Genshin from './assets/genshin.png';
import SearchDrawer from './components/SearchDrawer';
import PostsDrawer from "./components/PostsDrawer";
import { PageHeader } from "@ant-design/pro-components"
import { Button, Layout, message, Row, Skeleton, Spin, Table, Typography } from 'antd';
import { CrownFilled, LoadingOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';
import axios from 'axios';
import './App.css';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import encrypt from "./encrypt";
import 'nprogress/nprogress.css';

const { Content } = Layout;
const { Text } = Typography;
dayjs.locale('zh-cn');

function App() {
  // States
  const [results, setResults] = useState([]);
  const [anniversaries, setAnniversaries] = useState([]);
  const [spin, setSpin] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [userInfo, setUserInfo] = useState({
    link: '',
    title: '',
    text: ''
  });
  const [days, setDays] = useState([]);
  const [pagination, setPagination] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [searchTrigger, setSearchTrigger] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsTrigger, setPostsTrigger] = useState(false);
  // const [incomeLoading, setIncomeLoading] = useState(false);
  // const [incomeTrigger, setIncomeTrigger] = useState(false);
  // const [usersLoading, setUsersLoading] = useState(false);
  // const [usersTrigger, setUsersTrigger] = useState(false);

  // Constants
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
          setSpin(true);
          axios.post('https://app.drjchn.com/api/v2/tieba/user', {
            link: record.link,
            token: encrypt(record.link)
          }).then(rsp => {
            const nickname = rsp.data.user.nickname;
            setSpin(false);
            setUserInfo({
              link: rsp.data.user.avatar,
              title: !record.member ? nickname :
                '<span><i aria-label="icon: crown" class="anticon anticon-crown" style="color: rgb(255, 197, 61);"><svg viewBox="64 64 896 896" focusable="false" class="" data-icon="crown" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M899.6 276.5L705 396.4 518.4 147.5a8.06 8.06 0 0 0-12.9 0L319 396.4 124.3 276.5c-5.7-3.5-13.1 1.2-12.2 7.9L188.5 865c1.1 7.9 7.9 14 16 14h615.1c8 0 14.9-6 15.9-14l76.4-580.6c.8-6.7-6.5-11.4-12.3-7.9zM512 734.2c-62.1 0-112.6-50.5-112.6-112.6S449.9 509 512 509s112.6 50.5 112.6 112.6S574.1 734.2 512 734.2zm0-160.9c-26.6 0-48.2 21.6-48.2 48.3 0 26.6 21.6 48.3 48.2 48.3s48.2-21.6 48.2-48.3c0-26.6-21.6-48.3-48.2-48.3z"></path></svg></i> <span style="color: #f5222d">' + nickname + '</span></span>',
              text
            });
          }).catch(err => {
            console.log(err);
            setSpin(false);
            message.error("该用户不存在");
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
  const updateSize = () => {
    let height = window.innerHeight;
    const width = window.innerWidth;
    height = width > 576 ? height - 80 : height - 64;
    setContentHeight(height);
  };

  const handleTableChange = pg => {
    const pager = pagination;
    pager.current = pg.current;
    pager.pageSize = pg.pageSize;
    window.localStorage.setItem("pageSize", pg.pageSize);
    setSpin(true);
    setPagination(pager);
    axios.get('https://app.drjchn.com/api/v2/tieba/users', {
      params: {
        page: pager.current,
        pageSize: pager.pageSize,
        token: encrypt(pager.current)
      }
    }).then(rsp => {
      pager.total = rsp.data.total;
      setPagination(pager);
      setResults(rsp.data.users);
      setSpin(false);
    }).catch(err => {
      console.log(err);
      setSpin(false);
      message.error("加载失败");
    })
  };

  // Use Effect
  useEffect(() => {
    const pageSize = window.localStorage.getItem("pageSize") || 10;
    axios.get('https://app.drjchn.com/api/v2/tieba/anniversary')
      .then(res => {
        setAnniversaries(res.data.anniversaries.reverse());
      });
    axios.get('https://app.drjchn.com/api/v2/tieba/events')
      .then(res => {
        setDays(res.data.days);
      });
    axios.get('https://app.drjchn.com/api/v2/tieba/users', {
      params: {
        page: 1,
        pageSize,
        token: encrypt('1')
      }
    })
      .then(rsp => {
        setPageLoading(false);
        const pg = {};
        pg.current = 1;
        pg.total = rsp.data.total;
        pg.showQuickJumper = true;
        pg.size = "small";
        pg.showSizeChanger = true;
        pg.pageSizeOptions = ['10', '20'];
        pg.pageSize = pageSize;
        setPagination(pg);
        setResults(rsp.data.users);
      }).catch(err => {
      console.log(err);
      setPageLoading(false);
      message.error("页面加载失败");
    });
    updateSize();
    window.addEventListener('resize', updateSize);
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

  return (
    <Layout>
      <PageHeader
        avatar={{ src: Genshin }}
        title='原神吧排行榜'
      />
      <Layout>
        <Content style={{
          padding: 24,
          overflowX: "hidden",
          maxHeight: contentHeight,
          zIndex: 100
        }}>
          {/*Drawer Part*/}
          {/*<UserDrawer changeLoading={setUsersLoading} trigger={usersTrigger}/>*/}

          <SearchDrawer days={days} anniversaries={anniversaries} trigger={searchTrigger}/>

          <PostsDrawer changeLoading={setPostsLoading} trigger={postsTrigger}/>

          {/*<IncomeDrawer changeLoading={setIncomeLoading} trigger={incomeTrigger}/>*/}

          {/*Main Part of Page*/}
          <Skeleton active loading={pageLoading}>
            <Row>
              <Button
                type='primary'
                style={{ marginRight: 20 }}
                onClick={() => setSearchTrigger(!searchTrigger)}
              >搜索</Button>
              {/*<Button*/}
              {/*  onClick={() => setUsersTrigger(!usersTrigger)}*/}
              {/*  loading={usersLoading}*/}
              {/*  style={{ marginRight: 20 }}*/}
              {/*>用户统计</Button>*/}
              <Button
                loading={postsLoading}
                onClick={() => setPostsTrigger(!postsTrigger)}
                style={{ marginRight: 20 }}
              >发帖统计</Button>
              {/*<Button*/}
              {/*    loading={incomeLoading}*/}
              {/*    onClick={() => setIncomeTrigger(!incomeTrigger)}*/}
              {/*    style={{ marginRight: 20 }}*/}
              {/*>流水统计</Button>*/}
            </Row>
            <Spin
              tip='加载中...'
              spinning={spin}
              indicator={<LoadingOutlined/>}
            >
              <Table
                dataSource={results}
                columns={columns}
                rowKey='rank'
                pagination={pagination}
                onChange={handleTableChange}
                size={pagination.pageSize === 10 ? 'medium' : 'small'}
                style={{
                  background: '#fff',
                  marginTop: 20
                }}
              />
            </Spin>
          </Skeleton>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
