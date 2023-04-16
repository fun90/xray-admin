import request from '@/utils/request'

/**
 * 获取支持的客户端 vip
 */
export function getClients() {
  return request({
    url: `/config/clients`,
    method: 'get'
  })
}

/**
 * 获取账号等级 vip
 */
export function getAccountLevels() {
  return request({
    url: `/config/accountLevels`,
    method: 'get'
  })
}

/**
 * 获取账号等级 vip
 */
export function generateRulesFile() {
  return request({
    url: `/config/generateRulesFile`,
    method: 'get'
  })
}

