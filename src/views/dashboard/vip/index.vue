<template>
  <div class="dashboard-editor-container">
    <github-corner class="github-corner" />
    <el-row :gutter="10">
      <el-card>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="公告" name="Notice">
            <Notice />
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </el-row>
  </div>
</template>

<script>
import GithubCorner from '@/components/GithubCorner'
import Notice from './components/Notice'

export default {
  name: 'DashboardEditor',
  components: { GithubCorner, Notice },
  data: function() {
    return {
      activeNames: 0,
      list: null,
      activeTab: 'Notice'
    }
  }
}
</script>

<style lang="scss">

.github-corner {
  position: absolute;
  top: 0px;
  border: 0;
  right: 0;
}

.dashboard-editor-container {
  // background-color: #e3e3e3;
  a, a:focus, a:hover {
    cursor: pointer;
    color: #409EFF;
    text-decoration: none;
  }

  min-height: 100vh;
  padding: 50px 60px 0px;

  .pan-info-roles {
    font-size: 12px;
    font-weight: 700;
    color: #333;
    display: block;
  }

}
</style>
