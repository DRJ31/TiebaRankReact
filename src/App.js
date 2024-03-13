import React from 'react';
import Genshin from './assets/genshin.png';
import SearchDrawer from './components/SearchDrawer';
import VirusDrawer from "./components/VirusDrawer";
import UserDrawer from "./components/UserDrawer";
import PostsDrawer from "./components/PostsDrawer";
import IncomeDrawer from "./components/IncomeDrawer";
import PropTypes  from 'prop-types';
import { PageHeader } from "@ant-design/pro-components"
import {
  Button,
  Layout,
  message,
  Row,
  Skeleton,
  Spin,
  Table,
  Typography
} from 'antd';
import { LoadingOutlined, CrownFilled } from '@ant-design/icons';
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

class App extends React.Component {
  state = {
    results: [],
    anniversaries: [],
    loading: {
      page: true,
      users: false,
      search: false,
      posts: false,
      virus: false,
      income: false
    },
    spin: false,
    contentHeight: null,
    link: '',
    drawer: {
      users: null,
      search: null,
      posts: null,
      virus: null,
      income: null
    },
    pagination: {}
  };

  static childContextTypes = {
    encrypt: PropTypes.func,
    onRef: PropTypes.func
  }

  getChildContext() {
    return {
      encrypt: encrypt,
      onRef: this.onRef
    }
  }

  constructor(...props) {
    super(...props);
    const loading = { ...this.state.loading };
    const pageSize = window.localStorage.getItem("pageSize") || 10;
    axios.get('https://api.drjchn.com/api/v2/tieba/anniversary')
        .then(res => {
          let anniversaries = res.data.anniversaries.reverse();
          this.setState({ anniversaries });
        });
    axios.get('https://api.drjchn.com/api/v2/tieba/events')
        .then(res => {
          let days = res.data.days;
          this.setState({ days });
        });
    axios.get('https://api.drjchn.com/api/v2/tieba/users', {
      params: {
        page: 1,
        pageSize,
        token: encrypt('1')
      }
    })
      .then(rsp => {
        loading.page = false;
        const { pagination }= this.state;
        pagination.current = 1;
        pagination.total = rsp.data.total;
        pagination.showQuickJumper = true;
        pagination.size = "small";
        pagination.showSizeChanger = true;
        pagination.pageSizeOptions = ['10', '20'];
        pagination.pageSize = pageSize;
        this.setState({
          loading,
          pagination,
          results: rsp.data.users
        });
      }).catch(err => {
        console.log(err);
        loading.page = false;
        this.setState({ loading });
        message.error("页面加载失败");
    });
  }

  componentDidMount() {
    this.updateSize();
    window.addEventListener('resize', () => this.updateSize());
  }

  componentWillUnmount() {
    window.removeEventListener('resize', () => this.updateSize());
  }

  updateSize = () => {
    let height = window.innerHeight;
    let width = window.innerWidth;
    height = width > 576 ? height - 80 : height - 64;
    this.setState({
      contentHeight: height
    });
  };

  handleTableChange = pagination => {
    const pager = this.state.pagination;
    pager.current = pagination.current;
    pager.pageSize = pagination.pageSize;
    window.localStorage.setItem("pageSize", pagination.pageSize);
    this.setState({
      pagination: pager,
      spin: true
    });
    axios.get('https://api.drjchn.com/api/v2/tieba/users', {
      params: {
        page: pager.current,
        pageSize: pager.pageSize,
        token: encrypt(pager.current)
      }
    }).then(rsp => {
      pager.total = rsp.data.total;
      this.setState({
        pagination: pager,
        results: rsp.data.users,
        spin: false
      });
    }).catch(err => {
      console.log(err);
      this.setState({ spin: false });
      message.error("加载失败");
    })
  };

  onRef = (ref, name) => {
    const drawer = this.state.drawer;
    drawer[name] = ref;
    this.setState({ drawer });
  };

  render() {
    const { results, loading, contentHeight, spin, pagination } = this.state;
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
            const loading = { ...this.state.loading };
            loading.search = true;
            this.setState({
              spin: true,
              loading
            });
            axios.post('https://api.drjchn.com/api/v2/tieba/user', {
              link: record.link,
              token: encrypt(record.link)
            }).then(rsp => {
              loading.search = false;
              this.setState({
                link: rsp.data.user.avatar,
                spin: false,
                loading
              }, () => {
                const nickname = rsp.data.user.nickname;
                const title = !record.member ? nickname :
                  '<span><i aria-label="icon: crown" class="anticon anticon-crown" style="color: rgb(255, 197, 61);"><svg viewBox="64 64 896 896" focusable="false" class="" data-icon="crown" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M899.6 276.5L705 396.4 518.4 147.5a8.06 8.06 0 0 0-12.9 0L319 396.4 124.3 276.5c-5.7-3.5-13.1 1.2-12.2 7.9L188.5 865c1.1 7.9 7.9 14 16 14h615.1c8 0 14.9-6 15.9-14l76.4-580.6c.8-6.7-6.5-11.4-12.3-7.9zM512 734.2c-62.1 0-112.6-50.5-112.6-112.6S449.9 509 512 509s112.6 50.5 112.6 112.6S574.1 734.2 512 734.2zm0-160.9c-26.6 0-48.2 21.6-48.2 48.3 0 26.6 21.6 48.3 48.2 48.3s48.2-21.6 48.2-48.3c0-26.6-21.6-48.3-48.2-48.3z"></path></svg></i> <span style="color: #f5222d">' + nickname + '</span></span>';
                Swal.fire({
                  imageUrl: this.state.link,
                  title: title,
                  text: text
                });
              });
            }).catch(err => {
              console.log(err);
              loading.search = false;
              message.error("该用户不存在");
              this.setState({
                spin: false,
                loading
              });
            });
          }}>
            {!record.member ? (record.nickname ? record.nickname : text) : (
              <span><CrownFilled style={{ color: '#ffc53d' }} /> <Text
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
            <UserDrawer
              changeLoading={(boolean) => {
                const loading = this.state.loading;
                loading.users = boolean;
                this.setState({ loading })
              }}
            />

            <SearchDrawer
              days={this.state.days}
              anniversaries={this.state.anniversaries}
            />

            <VirusDrawer
              changeLoading={(boolean) => {
                const loading = this.state.loading;
                loading.virus = boolean;
                this.setState({ loading })
              }}
            />

            <PostsDrawer
              changeLoading={(boolean) => {
                const loading = this.state.loading;
                loading.posts = boolean;
                this.setState({ loading })
              }}
            />

            <IncomeDrawer
                changeLoading={(boolean) => {
                  const loading = this.state.loading;
                  loading.income = boolean;
                  this.setState({ loading })
                }}
            />

            {/*Main Part of Page*/}
            <Skeleton active loading={loading.page}>
              <Row>
                <Button
                  type='primary'
                  style={{ marginRight: 20 }}
                  onClick={() => this.state.drawer.search ? this.state.drawer.search.setState({ visible: true }) : () => {}}
                >搜索</Button>
                {/*<Button*/}
                {/*  onClick={() => this.state.drawer.users ? this.state.drawer.users.getStatisticalData(dayjs()) : () => {}}*/}
                {/*  loading={loading.users}*/}
                {/*  style={{ marginRight: 20 }}*/}
                {/*>用户统计</Button>*/}
                <Button
                  loading={loading.posts}
                  onClick={this.state.drawer.posts ? this.state.drawer.posts.getPostData : () => {}}
                  style={{ marginRight: 20 }}
                >发帖统计</Button>
                <Button
                    loading={loading.income}
                    onClick={this.state.drawer.income ? this.state.drawer.income.fetchData : () => {}}
                    style={{ marginRight: 20 }}
                >流水统计</Button>
                {/*<Button*/}
                {/*  type="danger"*/}
                {/*  loading={loading.virus}*/}
                {/*  onClick={this.state.drawer.virus ? this.state.drawer.virus.getVirusData : () => {}}*/}
                {/*  style={window.outerWidth < 768 ? { marginTop: 10 } : { marginTop: 0 }}*/}
                {/*>疫情实况</Button>*/}
              </Row>
              <Spin
                tip='加载中...'
                spinning={spin}
                indicator={<LoadingOutlined />}
              >
                <Table
                  dataSource={results}
                  columns={columns}
                  rowKey='rank'
                  pagination={pagination}
                  onChange={this.handleTableChange}
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
}

export default App;
