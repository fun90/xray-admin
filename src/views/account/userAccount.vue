<template>
  <div class="app-container ">

    <el-row :gutter="15">
      <el-col :span="3">
        <el-input v-model="listQuery.userEmail" placeholder="email" />
      </el-col>
      <el-col :span="3">
        <el-button @click="getList">搜索</el-button>
      </el-col>
      <el-col :span="3">
        <el-button @click="reloadProxy">重载</el-button>
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
          <div>账号等级:{{ scope.row.level |levelFilter }}</div>
          <div>账号状态:{{ scope.row.status |accountStatusFilter }}</div>
        </template>
      </el-table-column>

      <el-table-column align="left" label="">
        <template slot-scope="scope">

          <div>
            <el-link icon="el-icon-edit" type="primary" @click="openAccountDidlog(scope.row)">编辑账号</el-link>
          </div>
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
        <el-form-item v-if="accountForm.subconverterUrl !== '0'" label="客户端:">
          <el-col :xs="24" :sm="6" :lg="6">
            <el-select v-model="currentAppType" placeholder="请选择" @change="changeAppType">
              <el-option
                v-for="item in appTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-col>
        </el-form-item>
        <el-form-item label="订阅地址:">
          <el-col>
            <el-input v-model="accountForm.subscriptionUrl" readonly>  <el-button slot="prepend" @click="generatorNewSubscriptionUrl()">
              <div v-if="!accountForm.subscriptionUrl">生成</div><div v-if="accountForm.subscriptionUrl">更新</div>
            </el-button> <el-button slot="append" @click="handlerCopy(accountForm.subscriptionUrl2,$event)">复制</el-button> </el-input>
          </el-col>
        </el-form-item>

        <el-form-item>

          <el-button @click="submitUpdateAccount">提交</el-button>

        </el-form-item>
      </el-form>

    </el-dialog>

  </div>
</template>

<script>
import { accountsList, updateAccount, reloadProxyAccount, generatorSubscriptionUrlByAdmin, getUUID } from '@/api/account'
import { serverList } from '@/api/server'
import Pagination from '@/components/Pagination'
import clip from '@/utils/clipboard'
import { Base64 } from 'js-base64'
import store from '@/store'
import permission from '@/directive/permission/index.js'

var oneDayms = 3600 * 1000 * 24
export default {
  name: 'UserAccount',
  components: { Pagination },
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
    levelFilter(status) {
      const statusMap = {
        0: '等级0',
        1: '等级1',
        2: '等级2',
        3: '等级3'
      }
      return statusMap[status]
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
      levelOptions: [{ value: 0, label: '等级0' }, { value: 1, label: '等级1' }, { value: 2, label: '等级2' }, {
        value: 3,
        label: '等级3'
      }],
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
        level: 0
      },

      currentAppType: 'quan',
      appTypes: [{
        value: 'quan',
        label: 'Quantumult'
      }, {
        value: 'quanx',
        label: 'Quantumult X'
      }, {
        value: 'mixed',
        label: 'V2rayN/V2rayNG/Shadowrocket'
      }, {
        value: 'clash',
        label: 'Clash'
      }, {
        value: 'surge&ver=4',
        label: 'Surge 4'
      }, {
        value: 'surfboard',
        label: 'Surfboard'
      }],

      accountDialog: false,

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
        userEmail: ''
      }
    }
  },
  computed: {},
  created() {
    this.getList()
  },
  methods: {
    addToDate() {
      var toTime = this.accountForm.toDate
      this.accountForm.toDate = toTime + oneDayms * this.accountForm.addDay
    },
    handlerAccountCloseDialog(done) {
      done()
    },
    openAccountDidlog(row) {
      this.accountForm = row
      this.accountDialog = true
      this.setSubscriptionUrl(this.currentAppType)
      //  this.accountForm.rangeDate= [new Date().setTime(this.accountForm.fromDate),new Date().setTime(this.accountForm.toDate)]
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
    getServerList() {
      serverList(this.serverListQuery).then(response => {
        this.serverList = response.obj.content
        this.serverTotal = response.obj.total
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
    reloadProxy() {
      reloadProxyAccount()
    },
    generatorNewSubscriptionUrl() {
      const isEdit = !!this.accountForm.subscriptionUrl
      if (isEdit) {
        this.$confirm('确认更新操作？成功原订阅地址将失效。', '提示', {
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
        this.setSubscriptionUrl(this.currentAppType)
        this.$message.success('更新订阅地址成功，原地址已经失效')
        this.getList()
      })
    },
    changeAppType(appTypeValue) {
      this.currentAppType = appTypeValue
      this.setSubscriptionUrl(appTypeValue)
    },
    setSubscriptionUrl(appType) {
      if (this.accountForm.subconverterUrl !== '0' && this.accountForm.subscriptionUrl) {
        this.accountForm.subscriptionUrl2 = this.accountForm.subconverterUrl + '?target=' + appType + '&url=' + encodeURIComponent(this.accountForm.subscriptionUrl)
      } else {
        this.accountForm.subscriptionUrl2 = this.accountForm.subscriptionUrl
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
