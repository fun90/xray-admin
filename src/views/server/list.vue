<template>
  <div class="app-container">
    <el-table v-loading="listLoading" :data="list" border fit highlight-current-row>

      <!--      <el-table-column label="服务器ID">-->
      <!--        <template slot-scope="scope">-->
      <!--          <span>{{ scope.row.id }}</span>-->
      <!--        </template>-->
      <!--      </el-table-column>-->

      <el-table-column width="150" label="服务器名称">
        <template slot-scope="scope">
          <span>{{ scope.row.serverName }}</span>
        </template>
      </el-table-column>

      <el-table-column width="180" label="代理地址">
        <template slot-scope="scope">
          <span>{{ scope.row.v2rayIp }}</span>
        </template>
      </el-table-column>

      <el-table-column width="80" label="端口">
        <template slot-scope="scope">
          <span>{{ scope.row.clientPort }}</span>
        </template>
      </el-table-column>

      <el-table-column width="80" label="协议">
        <template slot-scope="scope">
          <span>{{ scope.row.protocol }}</span>
        </template>
      </el-table-column>

      <el-table-column width="400" label="协议属性">
        <template slot-scope="scope">
          <span>{{ scope.row.protocolField }}</span>
        </template>
      </el-table-column>

      <el-table-column width="80" label="等级">
        <template slot-scope="{row}">
          <span>{{ row.level | levelFilter }}</span>
        </template>
      </el-table-column>

      <el-table-column width="80" label="状态">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusFilter">
            {{ row.status |statusFilter2 }}
          </el-tag>

        </template>
      </el-table-column>

      <el-table-column label="服务描述">
        <template slot-scope="scope">
          <span>{{ scope.row.desc }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="241">
        <template slot-scope="scope">
          <router-link :to="'/server/edit/'+scope.row.id">
            <el-button type="primary" size="small" icon="el-icon-edit">
              编辑
            </el-button>
          </router-link>
          <el-button type="danger" size="small" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.pageSize" @pagination="getList" />
  </div>
</template>

<script>
import { serverList, deleteServer } from '@/api/server'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination

export default {
  name: 'ServerList',
  components: { Pagination },
  filters: {
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
    },
    levelFilter(level) {
      return '等级' + level
    }
  },
  data() {
    return {
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        pageSize: 20
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    handleDelete(id) {
      this.$confirm('此操作将永久删除, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteServer(id).then(() => {
          this.$message({
            type: 'success',
            message: '删除成功!'
          })
          this.getList()
        }).catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
      })
    },
    getList() {
      this.listLoading = true
      serverList(this.listQuery).then(response => {
        this.list = response.obj.content
        this.total = response.obj.total
        this.listLoading = false
      })
    }
  }
}
</script>

<style scoped>
.edit-input {
  padding-right: 100px;
}
.cancel-btn {
  position: absolute;
  right: 15px;
  top: 10px;
}
</style>
