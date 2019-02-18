console.log(213213123123)
dd.device.notification.showPreloader({
  text: '加载中..', //loading显示的字符，空表示不显示文字
  showIcon: true, //是否显示icon，默认true。Android无此参数。
  onSuccess: function(result) {},
  onFail: function(err) {}
})

var userid = '${userid}'
console.log('userid ==' + userid)
var corpId = '${corpId}'
var base = '${base}'
var globalIndex = {
  loadStart: function() {
    layer.load(2, {
      shade: [0.5, '#000']
    })
  },
  loadEnd: function() {
    layer.closeAll('loading')
  }
}
//钉钉授权
var storage = window.localStorage
var appName = 'ding'
localStorage.setItem('appName', appName)
var loginChineseName = localStorage.getItem('loginChineseName')
  ? encodeURI(localStorage.getItem('loginChineseName'))
  : ''

var project = window.top.base
//图钉状态
var dingState = false

var toDopage = 2
var toDoYuepage = 2
var chaoSongpage = 2

var isDaibanLoadMore = true
var isDaiyueLoadMore = true
var isChaoSongLoadMore = true

var toReadNum = 0
var toDodNum = 0
var chaoSongNum = 0

var noReadPassListN = 1
var copySendListN = 1

var savatoDoArr = []
var toDoArrIndex = []
var chaoSongArrIndex = []

var isDeleteObj
var isTabSroll = true
var version = '1'

var model = avalon.define({
  $id: 'wrap',
  isExist: function(obj) {
    var result = false
    if (obj.length == 0) {
      result = true
    }
    return result
  },
  toDoTipShow: false,
  toReadTipShow: false,
  chaoSongTipShow: false,

  toDoLoadShow: false,
  toReadLoadShow: false,
  chaoSongLoadShow: false,

  toDoTip: '加载中...',
  toReadTip: '加载中...',
  chaoSongTip: '加载中...',

  toDoData: [],
  toReadData: [],
  copySendList: [], //抄送

  curIndex: 0, // 0为待办 1为待阅
  thumbtackState: dingState //图钉的状态
})

$(function() {
  if (userid) {
    initData()
  } else {
    loadJsapi()
  }

  if (mui.ios) {
    $('html').addClass('Ios')
  }

  dd.ready(function() {
    dd.biz.navigation.setLeft({
      show: true, //控制按钮显示， true 显示， false 隐藏， 默认true
      control: true, //是否控制点击事件，true 控制，false 不控制， 默认false
      showIcon: true, //是否显示icon，true 显示， false 不显示，默认true； 注：具体UI以客户端为准
      text: '', //控制显示文本，空字符串表示显示默认文本
      onSuccess: function(result) {
        dd.biz.navigation.close()
      },
      onFail: function(err) {}
    })

    document.addEventListener(
      'backbutton',
      function(e) {
        e.preventDefault()
        dd.biz.navigation.close()
      },
      false
    )
    dd.ui.pullToRefresh.enable({
      //页面刷新
      onSuccess: function() {
        setTimeout(function() {
          dd.ui.pullToRefresh.stop()
          window.location.reload()
        }, 500)
      },
      onFail: function() {}
    })
    // 页面被唤醒的事件监听(webview)
    document.addEventListener(
      'resume',
      function(e) {
        e.preventDefault()
        setTimeout(function() {
          headerTipInfor()
          countNum()

          if (localStorage.getItem('passerUseExchange') == 'refresh') {
            localStorage.removeItem('passerUseExchange')
            model.toReadData = []
            countNum()
            noReadPassListData()
          }

          if (localStorage.getItem('page') == 'refresh') {
            localStorage.removeItem('page')
            refreshTipInfor()
          }
        }, 1000)
      },
      false
    )
  })

  //tab切换待办待阅
  mui(document).on(
    'tap',
    '.daibanyue .mui-col-xs-4 > div,.daibanyue .mui-col-xs-6 > div',
    function() {
      var index = $(this).data('index')
      console.log(index)
      model.curIndex = index
      if (index == 1 && noReadPassListN == 1) {
        noReadPassListN++
        noReadPassListData()
      }
      if (index == 2 && copySendListN == 1) {
        copySendListN++
        copySendListData()
      }
      isTabSroll = false
      setTimeout(function() {
        isTabSroll = true
      }, 200)
    }
  )

  //是否锁定图钉
  mui(document).on('tap', '.mui-col-xs-4 span,.mui-col-xs-6 span', function(e) {
    e.stopPropagation()
    var state = model.thumbtackState
    state = !state
    var url =
      project + '/mobile/admin/documentDataMobile/accountInfoUpdate.action?'
    $.post(
      url,
      {
        accountName: userid,
        state: state
      },
      function(data) {
        var resultData = data.datas
        model.thumbtackState = resultData
      }
    )
  })

  //待办办理单
  mui(document).on('tap', '.daiban li', function() {
    var $this = $(this)
    toDoArrIndex = $this.index()
    copyArrayObject(savatoDoArr, model.toDoData)
    var wfId = $(this).attr('data-id')
    var wfName = $(this).attr('data-wfname')
    var task_name = ''
    globalIndex.loadStart()
    isDeleteObj = $(this)
    if (wfId == '' || wfName == '') {
      mui.toast('数据异常！')
      return
    }
    var url =
      project +
      '/mobile/admin/documentBill/getBillName.action?etc=' +
      new Date().getTime() +
      '&wf_id=' +
      wfId +
      '&wf_name=' +
      wfName
    $.getJSON(url, function(response) {
      if (response.datas != null) {
        billId = response.datas.bill_id
        var id = response.datas.id
        if (appName == 'ding') {
          uf_doAction_open(
            userid,
            loginChineseName,
            billId,
            id,
            wfId,
            wfName,
            task_name,
            version,
            'ding',
            null
          )
        } else {
          uf_doAction_open(
            userid,
            loginChineseName,
            billId,
            id,
            wfId,
            wfName,
            task_name,
            version,
            1,
            null
          )
        }
      } else {
        var newUrl =
          project +
          '/mobile/admin/documentBill/getOfficeId.action?etc=' +
          new Date().getTime() +
          '&wf_id=' +
          wfId +
          '&wf_name=' +
          wfName
        $.getJSON(newUrl, function(response) {
          if (response != null) {
            billId = response.billId
            var id = response.id.id

            if (appName == 'ding') {
              uf_doAction_open(
                userid,
                loginChineseName,
                billId,
                id,
                wfId,
                wfName,
                task_name,
                version,
                'ding',
                null
              )
            } else {
              uf_doAction_open(
                userid,
                loginChineseName,
                billId,
                id,
                wfId,
                wfName,
                task_name,
                version,
                1,
                null
              )
            }
          } else {
            setTimeout(function() {
              globalIndex.loadEnd()
              mui.toast('获取办理单数据异常')
            }, 500)
          }
        })
      }
    })
  })

  //待阅办理单
  mui(document).on('tap', '.daiyue li', function() {
    var $this = $(this)
    var wfId = $(this).attr('data-id')
    var wfName = $(this).attr('data-wfname')
    var type = $(this).attr('data-type')
    var task_name = ''
    globalIndex.loadStart()
    setTimeout(function() {
      globalIndex.loadEnd()
      mui.toast('网络异常')
    }, 10000)

    isDeleteObj = $(this)
    if (wfId == '' || wfName == '') {
      mui.toast('数据异常！')
      return
    }
    var url =
      project +
      '/mobile/admin/documentBill/getBillName.action?etc=' +
      new Date().getTime() +
      '&wf_id=' +
      wfId +
      '&wf_name=' +
      wfName

    var showurl = $(this).attr('data-showurl')
    showurl = showurl.replace('run.html', 'run_ding_mobile.html')
    $.getJSON(url, function(response) {
      setTimeout(function() {
        $this.remove()
        toReadNum--
        $('.daiyue .number').each(function(index, value) {
          var value = Number(index) + 1
          $('.daiyue .number')
            .eq(index)
            .text(value + '.')
        })
        if (toReadNum != 0) {
          $('.toread').text('待阅(' + toReadNum + ')')
        } else {
          $('.toread').text('待阅')
          model.toReadData = []
        }

        globalIndex.loadEnd()
        if (response.datas != null) {
          billId = response.datas.bill_id
          var id = response.datas.id
          var surl =
            location.origin +
            project +
            showurl +
            '&billId=' +
            billId +
            '&officeId=' +
            id +
            '&loginName=' +
            userid +
            '&loginChineseName=' +
            loginChineseName
          console.log(surl)
          dd.biz.util.openLink({
            url: surl + '&dd_full_screen=true',
            onSuccess: function(result) {}
          })
        } else {
          mui.toast('获取办理单数据异常')
        }
      }, 100)
    })
  })

  //抄送办理单
  mui(document).on('tap', '.chaoSong li', function() {
    var $this = $(this)
    var wfId = $(this).attr('data-id')
    var wfName = $(this).attr('data-wfname')
    var type = $(this).attr('data-type')
    var task_name = ''
    globalIndex.loadStart()

    $this.remove()
    chaoSongNum--
    $('.chaoSong .number').each(function(index, value) {
      var value = Number(index) + 1
      $('.chaoSong .number')
        .eq(index)
        .text(value + '.')
    })
    if (chaoSongNum != 0) {
      $('.chaosong').text('抄送(' + chaoSongNum + ')')
    } else {
      $('.chaosong').text('抄送')
      model.copySendList = []
    }
    if (wfId == '' || wfName == '') {
      mui.toast('数据异常！')
      return
    }
    var url =
      location.origin +
      '${base}/mobile/admin/mobileDispatch/queryCopySendDetail.action?wfId=' +
      wfId +
      '&officeId=' +
      wfId +
      '&loginName=' +
      userid +
      '&loginChineseName=' +
      loginChineseName
    console.log(url)
    dd.biz.util.openLink({
      url: url + '&dd_full_screen=true',
      onSuccess: function(result) {}
    })
    globalIndex.loadEnd()
  })

  window.addEventListener('pageflowrefresh', function(e) {
    isDeleteObj.remove()
  })

  $(window).scroll(function() {
    var scrollTop = parseInt($(document).scrollTop())
    var scrollHeight = parseInt($(document).height())
    var innerHeight = $(window).innerHeight()

    if (scrollHeight - (scrollTop + innerHeight) <= 1 && isTabSroll) {
      if (model.curIndex == 0) {
        if (isDaibanLoadMore && model.toDoData.length > 0) {
          daibanData(model.curIndex)
        }
      } else if (model.curIndex == 1) {
        if (isDaiyueLoadMore && model.toReadData.length > 0) {
          daiyueData(model.curIndex)
        }
      } else if (model.curIndex == 2) {
        if (isChaoSongLoadMore && model.copySendList.length > 0) {
          chaoSongData(model.curIndex)
        }
      }
    }
  })
})

//待办数据加载
function daibanData(num) {
  model.toDoTipShow = true
  model.toDoLoadShow = true

  isDaibanLoadMore = false

  $.ajax({
    type: 'GET',
    url:
      '${base}/mobile/admin/mobileDispatch/getData.action?etc=' +
      new Date().getTime(),
    data: {
      username: userid,
      currentpage: toDopage,
      indexType: num
    },
    dataType: 'JSON',
    success: function(data) {
      toDopage++

      var dataArr = []
      data.datas.forEach(function(value) {
        dataArr.push({
          id: value.wf_id,
          title: value.title ? value.title.replace(/<br>/g, '') : '无标题',
          type: value.wfOutName,
          isLamp: value.isLamp,
          isRed: value.isRed ? '#ff0000' : '',
          isTimeLimit: value.isTimeLimit,
          typeClass: addTypeClass(value.wf_name),
          upperUser: value.upperUser,
          time: value.sign_date,
          wfname: value.wf_name
        })
      })
      console.log(dataArr)
      model.toDoData = model.toDoData.concat(dataArr)
      copyArrayObject(savatoDoArr, model.toDoData)

      if (model.toDoData.length > 0 && dataArr.length == 0) {
        model.toDoTipShow = true
        model.toDoTip = '没有更多数据了'
        isDaibanLoadMore = false
      } else {
        model.toDoTipShow = false
        isDaibanLoadMore = true
      }

      model.toDoLoadShow = false
    }
  })
}

//待阅数据加载
function daiyueData(num) {
  model.toReadTipShow = true
  model.toReadLoadShow = true

  isDaiyueLoadMore = false

  $.ajax({
    type: 'GET',
    url:
      '${base}/mobile/admin/mobileDispatch/getData.action?etc=' +
      new Date().getTime(),
    data: {
      username: userid,
      currentpage: toDoYuepage,
      indexType: num
    },
    dataType: 'JSON',
    success: function(data) {
      toDoYuepage++

      var dataArr = []
      data.datas.forEach(function(value) {
        dataArr.push({
          id: value.wf_id,
          title: value.title
            ? value.title.replace(/&lt;br&gt;/g, '')
            : '无标题',
          type: value.wfOutName,
          showurl: value.show_url,
          typeClass: addTypeClass(value.wf_name),
          upperUser: value.upperUser,
          time: value.create_dttm,
          wfname: value.wf_name
        })
      })
      console.log(dataArr)
      model.toReadData = model.toReadData.concat(dataArr)

      if (model.toReadData.length > 0 && dataArr.length == 0) {
        model.toReadTipShow = true
        model.toReadTip = '没有更多数据了'
        isDaiyueLoadMore = false
      } else {
        model.toReadTipShow = false
        isDaiyueLoadMore = true
      }

      $('.daiyue .number').each(function(index, value) {
        var value = Number(index) + 1
        $('.daiyue .number')
          .eq(index)
          .text(value + '.')
      })

      model.toReadLoadShow = false
    }
  })
}

//抄送数据加载
function chaoSongData(num) {
  model.chaoSongTipShow = true
  model.chaoSongLoadShow = true

  isChaoSongLoadMore = false

  $.ajax({
    type: 'GET',
    url:
      '${base}/mobile/admin/mobileDispatch/getData.action?etc=' +
      new Date().getTime(),
    data: {
      username: userid,
      currentpage: chaoSongpage,
      indexType: num
    },
    dataType: 'JSON',
    success: function(data) {
      chaoSongpage++

      var dataArr = []
      data.datas1.forEach(function(value) {
        dataArr.push({
          id: value.wf_id,
          title: value.title
            ? value.title.replace(/&lt;br&gt;/g, '')
            : '无标题',
          type: value.wfOutName,
          showurl: value.show_url,
          typeClass: addTypeClass(value.wf_name),
          upperUser: value.upperUser,
          time: value.create_dttm,
          wfname: value.wf_name,
          draft_dept: value.draft_dept,
          document_no: value.document_no,
          send_date: value.send_date
        })
      })
      console.log(dataArr)
      model.copySendList = model.copySendList.concat(dataArr)
      console.log(model.copySendList.length)
      console.log(dataArr.length)

      if (model.copySendList.length > 0 && dataArr.length == 0) {
        model.chaoSongTipShow = true
        model.chaoSongTip = '没有更多数据了'
        isChaoSongLoadMore = false
      } else {
        console.log('--------------------')
        model.chaoSongTipShow = false
        isChaoSongLoadMore = true
      }

      $('.chaoSong .number').each(function(index, value) {
        var value = Number(index) + 1
        $('.chaoSong .number')
          .eq(index)
          .text(value + '.')
      })

      model.chaoSongLoadShow = false
    }
  })
}

function openApp() {
  var urls = window.location.href
  jQuery.post(
    '${base}/mobile/ding/logon/getConfigue.action',
    {
      urls: urls
    },
    function(result) {
      if (result.success == 'success') {
        var agentid = result.agentid
        var corpId = result.corpId
        var timeStamp = result.timeStamp
        var nonceStr = result.nonceStr
        var signature = result.signature
        dd.config({
          agentId: agentid,
          corpId: corpId,
          timeStamp: timeStamp,
          nonceStr: nonceStr,
          signature: signature,
          jsApiList: [
            'runtime.permission.requestAuthCode',
            'device.launcher.checkInstalledApps',
            'device.launcher.launchApp',
            'device.notification.confirm'
          ] // 必填，需要使用的jsapi列表
        })
        dd.ready(function() {
          dd.device.launcher.checkInstalledApps({
            apps: ['com.rj.wisp.soft'], //iOS:应用scheme;Android:应用包名
            onSuccess: function(data) {
              //alert('dd data: ' + JSON.stringify(data));
              var installed = data.installed
              if (installed[0] == 'com.rj.wisp.soft') {
                //已安装RJ客户端
                //window.open("rjportal://zj.rjsoft.com/homepage?isrefresh=1");
                dd.device.launcher.launchApp({
                  app: 'com.rj.wisp.soft', //iOS:应用scheme;Android:应用包名
                  activity: '', //仅限Android，打开指定Activity，可不传。如果为空，就打开App的Main入口Activity
                  onSuccess: function(data) {},
                  onFail: function(err) {}
                })
                dd.biz.navigation.close()
              } else {
                if (isAndroid_ios()) {
                  //安卓
                  //window.open('/eden.oa/oa/page/app/downloadPage.html');
                  var pageUrl = '${base}/oa/page/app/downloadPage.html'
                  dd.biz.util.openLink({
                    url: location.origin + pageUrl + '?dd_full_screen=true',
                    onSuccess: function(result) {}
                  })
                } else {
                  //ios
                  dd.device.notification.alert({
                    message: 'ios版本暂不支持',
                    title: '提示', //可传空
                    buttonName: '确定',
                    onSuccess: function() {
                      //onSuccess将在点击button之后回调
                      /*回调*/
                      //dd.biz.navigation.close();
                    },
                    onFail: function(err) {}
                  })
                }
              }
            },
            onFail: function(err) {}
          })
        })

        dd.error(function(result) {
          alert('dd error: ' + JSON.stringify(result))
          $('.mask').hide()
        })
      } else {
        dd.error(function(result) {
          alert('dd error: ' + JSON.stringify(result))
          $('.mask').hide()
        })
      }
    }
  )
}
//判断是否是安卓还是ios
function isAndroid_ios() {
  var u = navigator.userAgent,
    app = navigator.appVersion
  var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1 //android终端或者uc浏览器
  var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/) //ios终端
  return isAndroid == true ? true : false
}

function openAppMarket() {
  //var pageUrl = "${base}/oa/page/app/error.html?dd_full_screen=true&type=1";  //type = 1 为公文库

  //if(userid == "eden" || userid == "jiangcj" || userid == "hongl"){
  var pageUrl =
    '${base}/mobile/ding/logon/indexDocument.action?dd_full_screen=true'
  //}

  console.log(location.origin + pageUrl)
  dd.biz.util.openLink({
    url: location.origin + pageUrl,
    onSuccess: function(result) {}
  })
}
function openCoremail() {
  var pageUrl =
    '${base}/mobile/admin/mobileDispatch/getToken.action?wfType=noDo'
  console.log(location.origin + pageUrl)
  dd.biz.util.openLink({
    url: location.origin + pageUrl,
    onSuccess: function(result) {}
  })
}
function openPage(pageType) {
  if (pageType == 1) {
    var pageUrl =
      '${base}/mobile/admin/mobileDispatch/incomingMobileManage.action?wfType=noDo'
  } else if (pageType == 2) {
    var pageUrl =
      '${base}/mobile/admin/mobileDispatch/meetingMobileManage.action?wfType=noDo'
  } else if (pageType == 3) {
    var pageUrl =
      '${base}/mobile/admin/mobileDispatch/executeInstMobileManage.action?wfType=toDo'
  } else if (pageType == 4) {
    var pageUrl =
      '${base}/mobile/admin/mobileDispatch/sptrainMobileManage.action?wfType=noDo'
  } else if (pageType == 5) {
    //var pageUrl = "${base}/oa/page/app/error.html?wfType=noDo";
    var pageUrl =
      '${base}/mobile/admin/mobileDispatch/getToken.action?wfType=noDo'
  } else if (pageType == 0) {
    var pageUrl =
      '${base}/mobile/admin/mobileDispatch/getCmsNotice.action?etc=' +
      new Date().getTime()
    // var pageUrl = "${base}/oa/page/app/error.html?wfType=noDo";
  }

  console.log(location.origin + pageUrl)
  dd.biz.util.openLink({
    url: location.origin + pageUrl + '&dd_full_screen=true',
    onSuccess: function(result) {}
  })
}

//数据类型添加颜色
function addTypeClass(str) {
  var val
  if (str == 'oa_pg_incoming_document' || str == 'oa_send_document') {
    //收文发文
    val = '#48a5f5'
  } else if (
    str == 'oa_leader_instruction' ||
    str == 'oa_leader_instruction_fb'
  ) {
    //批示
    val = '#fabb0e'
  } else if (str == 'oa_sptrain_audit') {
    //专项事务
    val = '#1dc798'
  } else if (
    str == 'oa_provincial_meeting_approve' ||
    str == 'oa_provincial_meeting_record' ||
    str == 'oa_meeting_program_approval' ||
    str == 'oa_meeting_notification_approval'
  ) {
    //会议
    val = '#fc8a06'
  } else {
    //其他
    val = '#fc8a06'
  }

  return val
}

// window.onload = function() {
//     setTimeout(function() {
//         globalIndex.loadEnd();
//     }, 500)
// }

//获取待办待阅数量
function countNum() {
  var urlData = [
      '/mobile/admin/mobileDispatch/getCurrentTaskCount.action?etc=' +
        new Date().getTime(),
      '/mobile/admin/mobileDispatch/getCurrentNoReadCount.action?etc=' +
        new Date().getTime(),
      '/mobile/admin/mobileDispatch/getCopySendCount.action?etc=' +
        new Date().getTime()
    ],
    idData = ['0', '1', '2']

  urlData.forEach(function(value, index) {
    var url = base + value
    $.getJSON(url, function(data) {
      var totalNum = data.count
      $('.js-middle-num').each(function() {
        var $this = $(this),
          id = $this.attr('data-index')

        if (id == idData[index]) {
          if (parseInt(totalNum) != 0) {
            if (index == 0) {
              $('.js-middle-num')
                .eq(index)
                .text('待办(' + totalNum + ')')
              toDodNum = totalNum
            } else if (index == 1) {
              $('.js-middle-num')
                .eq(index)
                .text('待阅(' + totalNum + ')')
              toReadNum = totalNum
            } else if (index == 2) {
              $('.js-middle-num')
                .eq(index)
                .text('抄送(' + totalNum + ')')
              chaoSongNum = totalNum
            }
          } else {
            if (index == 0) {
              $('.js-middle-num')
                .eq(index)
                .text('待办')
            } else if (index == 1) {
              $('.js-middle-num')
                .eq(index)
                .text('待阅')
            } else if (index == 2) {
              $('.js-middle-num')
                .eq(index)
                .text('抄送')
            }
          }
        }
      })
    })
  })
}

//获取九宫格待办数据
function headerTipInfor() {
  var urlData = [
      '/mobile/admin/mobileDispatch/getIncomingSum.action?etc=' +
        new Date().getTime() +
        '&wfType=noDo',
      '/mobile/admin/mobileDispatch/countMeetingInfoNoDo.action?etc=' +
        new Date().getTime(),
      '/mobile/admin/mobileDispatch/instCount.action?etc=' +
        new Date().getTime(),
      '/mobile/admin/mobileDispatch/getSptrainSum.action?etc=' +
        new Date().getTime()
    ],
    idData = [
      'oa_document_manage',
      'meetingManager',
      'leader_instruction',
      'oa_sptrain_message'
    ]

  urlData.forEach(function(value, index) {
    var url = base + value
    $.getJSON(url, function(data) {
      var totalNum = data.totalCount2
      $('.js-top-li').each(function() {
        var $this = $(this),
          id = $this.attr('data-id')
        if (id == idData[index]) {
          var $topLi = $this.find('.js-header-tip')
          if ($topLi.length) {
            $topLi.remove()
          }
          if (parseInt(totalNum)) {
            if (totalNum < 10) {
              $this.append(
                '<div class="main-header-note-tip js-header-tip one-digit">' +
                  totalNum +
                  '</div>'
              )
            } else if (totalNum >= 10 && totalNum <= 99) {
              $this.append(
                '<div class="main-header-note-tip js-header-tip two-digit">' +
                  totalNum +
                  '</div>'
              )
            } else {
              $this.append(
                '<div class="main-header-note-tip js-header-tip three-digit">99+</div>'
              )
            }
          }
        }
      })
    })
  })
}

function getUrlParam(name) {
  var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)')
  var r = window.location.search.substr(1).match(reg)
  if (r != null) return unescape(r[2])
  return null
}

function refreshTipInfor() {
  setTimeout(function() {
    if (model.curIndex == 0) {
      headerTipInfor()
      countNum()
      noBanPassListData()
    }
  }, 1500)
}
function getState() {
  var url =
    '${base}/mobile/ding/logon/getState.action?etc=' + new Date().getTime()
  //var url = "${base}/mobile/admin/mobileDispatch/getState.action?etc=" + new Date().getTime();
  $.ajax({
    type: 'GET',
    url: url,
    dataType: 'JSON',
    success: function(data) {
      if (data.state == 'false') {
        model.thumbtackState = false
      } else {
        model.thumbtackState = true
      }
    },
    error: function(msg) {
      alert('数据加载失败！')
    }
  })
}
function initData() {
  //获取九宫格待办数据
  headerTipInfor()
  //获取待办待阅数量
  countNum()
  getState()

  noBanPassListData()
}

function noBanPassListData() {
  var url =
    '${base}/mobile/admin/mobileDispatch/IndexMobileManageData.action?etc=' +
    new Date().getTime() +
    '&type=toDoList'
  globalIndex.loadStart()
  $.ajax({
    type: 'GET',
    url: url,
    dataType: 'JSON',
    success: function(data) {
      dd.device.notification.hidePreloader({
        onSuccess: function(result) {},
        onFail: function(err) {}
      })

      globalIndex.loadEnd()
      if (data.toDoList.length != 0) {
        model.toDoData = []
        data.toDoList.forEach(function(value) {
          model.toDoData.push({
            id: value.wf_id,
            title: value.title ? value.title.replace(/<br>/g, '') : '无标题',
            type: value.wfOutName,
            isLamp: value.isLamp,
            isRed: value.isRed ? '#ff0000' : '',
            isTimeLimit: value.isTimeLimit,
            typeClass: addTypeClass(value.wf_name),
            upperUser: value.upperUser,
            time: value.sign_date,
            wfname: value.wf_name
          })
        })
      } else {
        model.toDoData = data.toDoList
      }
    },
    error: function(msg) {
      dd.device.notification.hidePreloader({
        onSuccess: function(result) {},
        onFail: function(err) {}
      })
      globalIndex.loadEnd()
      alert('数据加载失败！')
    }
  })
}

function noReadPassListData() {
  var url =
    '${base}/mobile/admin/mobileDispatch/IndexMobileManageData.action?etc=' +
    new Date().getTime() +
    '&type=noReadPassList'
  $.ajax({
    type: 'GET',
    url: url,
    dataType: 'JSON',
    success: function(data) {
      if (data.noReadPassList.length != 0) {
        data.noReadPassList.forEach(function(value) {
          model.toReadData.push({
            id: value.wf_id,
            title: value.title
              ? value.title.replace(/&lt;br&gt;/g, '')
              : '无标题',
            type: value.wfOutName,
            showurl: value.show_url,
            typeClass: addTypeClass(value.wf_name),
            upperUser: value.upperUser,
            time: value.create_dttm,
            wfname: value.wf_name
          })
        })
      } else {
        model.toReadData = data.noReadPassList
      }
    },
    error: function(msg) {
      globalIndex.loadEnd()
      alert('数据加载失败！')
    }
  })
}

function copySendListData() {
  var url =
    '${base}/mobile/admin/mobileDispatch/IndexMobileManageData.action?etc=' +
    new Date().getTime() +
    '&type=copySendList '
  $.ajax({
    type: 'GET',
    url: url,
    dataType: 'JSON',
    success: function(data) {
      if (data.copySendList.length != 0) {
        data.copySendList.forEach(function(value) {
          model.copySendList.push({
            id: value.wf_id,
            title: value.title
              ? value.title.replace(/&lt;br&gt;/g, '')
              : '无标题',
            type: value.wfOutName,
            showurl: value.show_url,
            typeClass: addTypeClass(value.wf_name),
            upperUser: value.upperUser,
            time: value.create_dttm,
            wfname: value.wf_name,
            draft_dept: value.draft_dept,
            document_no: value.document_no,
            send_date: value.send_date
          })
        })
      } else {
        model.copySendList = data.copySendList
      }
    },
    error: function(msg) {
      globalIndex.loadEnd()
      alert('数据加载失败！')
    }
  })
}

function retrieveData() {
  location.reload()
}

//数组拷贝
function copyArrayObject(a, b) {
  a.lenght = 0
  for (var i = 0, max = b.length; i < max; i++) {
    a[i] = {}
    for (var j in b[i]) {
      a[i][j] = b[i][j]
    }
  }
}

function loadJsapi() {
  //钉钉授权免登
  dd.ready(function() {
    dd.runtime.permission.requestAuthCode({
      corpId: corpId,
      onSuccess: function(info) {
        var code = info.code
        jQuery
          .post(
            '${base}/mobile/authhelper/indexMobileConsole.action?code=' + code,
            {},
            function(data) {
              var result = data.message
              if (result == 0) {
                storage.dingUserId = data.userid
                storage.chinaName = data.chinaName
                userid = data.userid
                loginChineseName = encodeURI(data.chinaName)
                localStorage.setItem('userid', userid)
                localStorage.setItem('loginChineseName', data.chinaName)
                initData()
              } else {
                dd.device.notification.hidePreloader({
                  onSuccess: function(result) {},
                  onFail: function(err) {}
                })
                alert('暂未开通权限，请联系管理员!')
                dd.biz.navigation.close()
              }
            }
          )
          .error(function(err) {
            dd.device.notification.hidePreloader({
              onSuccess: function(result) {},
              onFail: function(err) {}
            })
            alert('后台数据报错！ ')
            dd.biz.navigation.close()
          })
      },
      onFail: function(err) {
        dd.device.notification.hidePreloader({
          onSuccess: function(result) {},
          onFail: function(err) {}
        })
        alert('fail: ' + JSON.stringify(err))
        dd.biz.navigation.close()
      }
    })
  })

  dd.error(function(result) {
    dd.device.notification.hidePreloader({
      onSuccess: function(result) {},
      onFail: function(err) {}
    })
    alert('dd error: ' + JSON.stringify(result))
    dd.biz.navigation.close()
  })
}
