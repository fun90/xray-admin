<template>
  <div class="app-container ">

    <el-row :gutter="15">
      <el-col :span="3">
        <el-input v-model="listQuery.userEmail" placeholder="email" />
      </el-col>
      <el-col :span="3">
        <el-input v-model="listQuery.userRemark" placeholder="remark" />
      </el-col>
      <el-col :span="3">
        <el-button @click="getList">搜索</el-button>
      </el-col>
      <el-col :span="6">
        <el-button @click="clickReloadBtn">刷新服务器</el-button>
        <el-button @click="clickGenerateBtn">生成分流规则文件</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="listLoading" :data="list" fit highlight-current-row style="width: 100%">

      <el-table-column align="left" label="账号信息">
        <template slot-scope="scope">
          <div><span>用户：{{ scope.row.userVO?scope.row.userVO.email:'' }}</span></div>
          <div><span>备注：{{ scope.row.userVO?scope.row.userVO.remark:'' }}</span></div>
          <div><span>账号：{{ scope.row.uuid }}</span></div>

        </template>
      </el-table-column>

      <el-table-column align="left" label="">
        <template slot-scope="scope">
          <div>
            <span> 有效时间： </span>
            <span>
              <font v-if="scope.row.toDate>new Date().getTime()">  {{ scope.row.toDate | parseTime('{y}-{m}-{d} {h}:{i}') }}</font>
              <font v-else color="red">  {{ scope.row.toDate | parseTime('{y}-{m}-{d} {h}:{i}') }}</font>
            </span>
          </div>
          <div v-if="scope.row.statVO">

            <span>结算时间：{{ scope.row.statVO.toDate | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column align="left" label="">
        <template slot-scope="scope">
          <div><span>速率：{{ scope.row.speed | speedFilter }}</span></div>
          <div>周期：{{ scope.row.cycle }}天/周期</div>
          <div>流量：<span>
            <font v-if="(scope.row.statVO?(scope.row.statVO.flow/1024/1024/1024).toFixed(2) : 0)<scope.row.bandwidth">{{ scope.row.statVO?(scope.row.statVO.flow/1024/1024/1024).toFixed(2) : 0 }}</font>
            <font v-else color="red">{{ scope.row.statVO?(scope.row.statVO.flow/1024/1024/1024).toFixed(2) : 0 }}</font>
            /{{ scope.row.bandwidth }}GB/周期</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column align="left" label="">
        <template slot-scope="scope">
          <div>单服务器连接数：{{ scope.row.maxConnection }}/账号</div>
          <div>账号等级:{{ levelFilter(scope.row.level) }}</div>
          <div>账号状态:{{ scope.row.status |accountStatusFilter }}</div>
        </template>
      </el-table-column>

      <el-table-column align="left" label="">
        <template slot-scope="scope">

          <el-row :gutter="20">
            <el-col :span="50">
              <el-link icon="el-icon-edit" type="primary" @click="openAccountDialog(scope.row)">编辑账号</el-link>
            </el-col>
            <el-col :span="50">
              <el-link icon="el-icon-link" type="primary" @click="openSubscribeDialog(scope.row)">订阅链接</el-link>
            </el-col>
          </el-row>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.pageSize"
      @pagination="getList"
    />

    <!-- 账号管理 -->
    <el-dialog title="修改" :visible.sync="accountDialog" :before-close="handlerAccountCloseDialog">
      <el-form ref="accountForm" :model="accountForm" label-width="80px">
        <el-form-item label="账号">
          <el-input v-model="accountForm.uuid" readonly><el-button slot="append" @click="generatorUUID()">更新</el-button></el-input>
        </el-form-item>
        <el-form-item label="周期">
          <el-input v-model="accountForm.cycle" />
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker
            v-model="accountForm.fromDate"
            value-format="timestamp"
            type="datetime"
          />
          <span>to</span>
          <el-date-picker
            v-model="accountForm.toDate"
            value-format="timestamp"
            type="datetime"
          />
          <!-- <el-input v-model="accountForm.fromDate"></el-input> -->
        </el-form-item>
        <el-form-item label="增加N天">
          <el-input v-model="accountForm.addDay" size="medium">
            <el-button slot="append" @click="addToDate">增加</el-button>
          </el-input>
        </el-form-item>
        <el-form-item label="速率">
          <el-input v-model="accountForm.speed" />
        </el-form-item>
        <el-form-item label="流量">
          <el-input v-model="accountForm.bandwidth" />
        </el-form-item>
        <el-form-item label="alterId">
          <el-input v-model="accountForm.maxConnection" />
        </el-form-item>

        <el-form-item label="账号等级" prop="level">
          <el-select v-model="accountForm.level">
            <el-option
              v-for="item in levelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="accountForm.status" placeholder="状态">
            <el-option
              v-for="item in accountFormOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="指定服务">
          <el-select v-model="accountForm.serverIds" placeholder="请选择服务器" filterable multiple style="width:500px">
            <el-option v-for="item in serverList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item>

          <el-button @click="submitUpdateAccount">提交</el-button>

        </el-form-item>
      </el-form>

    </el-dialog>

    <!-- 订阅链接 -->
    <el-dialog title="订阅链接" :visible.sync="subscribeDialog" :before-close="handlerSubscribeDialog">
      <el-form label-width="80px">
        <el-form-item label="客户端:">
          <el-select v-model="currentAppType" placeholder="请选择" @change="changeAppType">
            <el-option
              v-for="item in appTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="规则模式:">
          <el-select v-model="whitelistModel" placeholder="请选择" @change="changeRuleModel">
            <el-option key="false" label="黑名单" value="false" />
            <el-option key="true" label="白名单" value="true" />
          </el-select>
        </el-form-item>
        <el-form-item label="订阅链接:">
          <el-input v-model="accountForm.subscriptionUrl2" readonly>  <el-button slot="prepend" @click="generatorNewSubscriptionUrl()">
            <div v-if="!accountForm.subscriptionUrl">生成</div><div v-if="accountForm.subscriptionUrl">更新</div>
          </el-button> <el-button slot="append" @click="handlerCopy(accountForm.subscriptionUrl2,$event)">复制</el-button> </el-input>
        </el-form-item>
        <el-form-item label="二维码">
          <div v-if="accountForm.subscriptionUrl2">
            <vue-qr :text="accountForm.subscriptionUrl2" qid="qrcode2" />
          </div>
        </el-form-item>
      </el-form>
    </el-dialog>

  </div>
</template>

<script>
import { accountsList, updateAccount, reloadProxyAccount, generatorSubscriptionUrlByAdmin, getUUID } from '@/api/account'
import { allAvailableServers } from '@/api/server'
import { getClients, getAccountLevels, generateRulesFile } from '@/api/config'
import Pagination from '@/components/Pagination'
import clip from '@/utils/clipboard'
import { Base64 } from 'js-base64'
import store from '@/store'
import permission from '@/directive/permission/index.js'
import VueQr from 'vue-qr'

var oneDayms = 3600 * 1000 * 24
export default {
  name: 'UserAccount',
  components: { Pagination, VueQr },
  directives: { permission },
  filters: {
    accountStatusFilter(status) {
      const statusMap = {
        '1': '正常',
        '0': '禁用'
      }
      return statusMap[status]
    },
    speedFilter: function(v) {
      if (v <= 1024) {
        return '流畅'
      } else if (v > 1024 && v <= 2024) {
        return '高速'
      } else {
        return '极速'
      }
    },
    statusFilter(status) {
      const statusMap = {
        '1': 'success',
        '0': 'danger'
      }
      return statusMap[status]
    },
    statusFilter2(status) {
      const statusMap = {
        '1': '在线',
        '0': '下线'
      }
      return statusMap[status]
    }
  },
  data() {
    return {
      levelOptions: [],
      accountFormOptions: [{
        value: 1,
        label: '正常'
      }, {
        value: 0,
        label: '禁止'
      }],
      accountForm: {
        id: null,
        fromDate: null,
        toDate: null,
        cycle: null,
        accountNo: null,
        bandwidth: null,
        status: '1',
        addDay: 0,
        level: 0,
        serverIds: []
      },

      currentAppType: '',
      whitelistModel: 'false',
      appTypes: [],

      accountDialog: false,
      subscribeDialog: false,

      roles: store.getters.roles,
      toColip: '',
      opAccountId: null,
      serverTotal: 0,
      chooseServerId: null,
      serverListQuery: {
        page: 1,
        pageSize: 10
      },
      serverDialog: false,
      serverList: null,
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        pageSize: 50,
        userEmail: '',
        userRemark: ''
      }
    }
  },
  computed: {},
  created() {
    this.getList()
    this.refreshServerList()
    getClients().then(response => {
      this.appTypes = response.obj
    })
    getAccountLevels().then(response => {
      this.levelOptions = response.obj
    })
  },
  methods: {

    addToDate() {
      var toTime = this.accountForm.toDate
      this.accountForm.toDate = toTime + oneDayms * this.accountForm.addDay
    },
    handlerAccountCloseDialog(done) {
      done()
    },
    openAccountDialog(row) {
      this.refreshServerList()
      this.accountForm = row
      this.accountDialog = true
      this.setSubscriptionUrl()
      //  this.accountForm.rangeDate= [new Date().setTime(this.accountForm.fromDate),new Date().setTime(this.accountForm.toDate)]
    },
    handlerSubscribeDialog(done) {
      this.currentAppType = ''
      this.whitelistModel = 'false'
      this.subscriptionUrl = ''
      this.subscriptionUrl2 = ''
      done()
    },
    openSubscribeDialog(row) {
      this.accountForm = row
      this.subscribeDialog = true
    },
    handlerCopy(text, event) {
      //   console.log(Base64.encode('dankogai'))
      clip(text, event)
    },
    submitUpdateAccount() {
      this.accountForm.content = null
      updateAccount(this.accountForm).then(_ => {
        this.$message.success('提交成功')
        this.getList()
      })
    },
    handleCurrentChange(rows) {
      this.chooseServerId = null
      if (rows.length > 1) {
        this.$message.error('只能选择一个服务器')
        return
      }
      if (rows.length < 1) {
        return
      }
      var row = rows[0]
      this.chooseServerId = row && row.id ? row.id : null
    },

    refreshServerList() {
      allAvailableServers().then(response => {
        this.serverList = []
        for (const i in response.obj) {
          const server = response.obj[i]
          const localserver = {}
          localserver.value = server.id
          localserver.label = server.serverName
          this.serverList[i] = localserver
        }
      })
    },

    formatDate(date) {
      if (!date) return ''
      var year = date.getFullYear()
      var month = date.getMonth() + 1
      var day = date.getDate()
      var hour = date.getHours()
      var minute = date.getMinutes()
      var second = date.getSeconds()
      return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second
    },
    getList() {
      this.listLoading = true
      accountsList(this.listQuery).then(response => {
        this.list = response.obj.content
        for (var i = 0; i < this.list.length; i++) {
          var content = this.list[i].content
          this.list[i].content = content ? JSON.parse(content) : {}
          this.list[i].toColip = 'vmess://' + Base64.encode(content)
        }
        // console.log(this.list);
        this.total = response.obj.total
        this.listLoading = false
      })
    },
    clickReloadBtn() {
      reloadProxyAccount().then(_ => {
        this.$message.success('操作成功')
        this.getList()
      })
    },
    clickGenerateBtn() {
      generateRulesFile().then(_ => {
        this.$message.success('操作成功')
        this.getList()
      })
    },
    generatorNewSubscriptionUrl() {
      const isEdit = !!this.accountForm.subscriptionUrl
      if (isEdit) {
        this.$confirm('确认更新操作？成功原订阅链接将失效。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          roundButton: true,
          center: false
        }).then(() => {
          this.trueGeneratorSubscriptionUrl()
        }).catch(() => {

        })
      } else {
        this.trueGeneratorSubscriptionUrl()
      }
    },
    trueGeneratorSubscriptionUrl() {
      const data = { 'id': this.accountForm.id, 'type': 0 }
      this.accountForm.subscriptionUrl = 'response.ob'
      generatorSubscriptionUrlByAdmin(data).then(response => {
        this.accountForm.subscriptionUrl = response.obj
        this.setSubscriptionUrl()
        this.$message.success('更新订阅链接成功，原地址已经失效')
        this.getList()
      })
    },
    changeAppType(appTypeValue) {
      this.currentAppType = appTypeValue
      this.setSubscriptionUrl()
      this.$message.success('切换成功，请复制或扫码')
    },
    changeRuleModel(whitelistModel) {
      this.whitelistModel = whitelistModel
      this.setSubscriptionUrl()
      this.$message.success('切换成功，请复制或扫码')
    },
    setSubscriptionUrl() {
      if (this.accountForm.subconverterUrl !== '0' && this.accountForm.subscriptionUrl) {
        this.accountForm.subscriptionUrl2 = this.accountForm.subconverterUrl + '?target=' + this.currentAppType + '&whitelist=' + this.whitelistModel + '&url=' + encodeURIComponent(this.accountForm.subscriptionUrl)
      } else {
        const urlObj = new URL(this.accountForm.subscriptionUrl)
        urlObj.searchParams.set('target', this.currentAppType)
        urlObj.searchParams.set('type', '1')
        urlObj.searchParams.set('whitelist', this.whitelistModel)
        this.accountForm.subscriptionUrl2 = urlObj.toString()
      }
    },
    generatorUUID() {
      getUUID().then(response => {
        this.accountForm.uuid = response.obj
        updateAccount({ 'id': this.accountForm.id, 'uuid': this.accountForm.uuid }).then(_ => {
          this.$message.success('更新UUID成功')
          this.getList()
        })
      })
    },

    levelFilter(status) {
      const opts = this.levelOptions
      for (const i in opts) {
        if (status === opts[i].value) {
          return opts[i].label
        }
      }
      return null
    }
  }
}
</script>
<style scoped>

  .mainDiv {
    margin-left: 10%;
    margin-right: 10%;

  }

  .box-card {
    width: 480px;
  }
</style>
