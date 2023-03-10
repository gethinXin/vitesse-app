import axios from 'axios'
import type { AxiosInstance } from 'axios'
import qs from 'qs'
import type { InstanceInterceptors, RequestConfig, RequestInterceptors } from './index.type'

class Request {
  instance: AxiosInstance
  // 拦截器对象
  interceptorsObj?: RequestInterceptors
  constructor(config: RequestConfig<RequestInterceptors>) {
    this.instance = axios.create(config)
    this.interceptorsObj = config.interceptors
    // 全局拦截
    this.instance.interceptors.request.use(config => config)
    this.instance.interceptors.response.use(res => res.data)

    // 私有拦截器
    this.instance.interceptors.request.use(
      config.interceptors?.requestInterceptors,
      config.interceptors?.requestInterceptorsCatch,
    )
    this.instance.interceptors.response.use(
      config.interceptors?.responseInterceptors,
      config.interceptors?.responseInterceptorsCatch,
    )
  }

  request<T>(config: RequestConfig<InstanceInterceptors<T>>): Promise<T> {
    return new Promise((resolve, reject) => {
      // 如果我们为单个请求设置拦截器，这里使用单个请求的拦截器
      if (config.interceptors?.requestInterceptors)
        config = config.interceptors.requestInterceptors(config)

      const { method, dataType = 'JSON' } = config

      const methodType = method?.toLowerCase() ?? 'get'

      // 参数容错
      if (!config.params) {
        if (methodType === 'get')
          config.params = config.data || {}
        else if (methodType === 'post')
          config.data = config.params || {}
      }

      // 自动调整请求头
      if (dataType.toLowerCase() === 'json') {
        config.headers = {
          ...config.headers,
          'Content-Type': 'application/json; charset=UTF-8',
        }
      }
      else {
        config.headers = {
          ...config.headers,
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        }
        config.data = qs.stringify(config.data, { arrayFormat: 'repeat' }) || {}
      }

      this.instance
        .request<any, T>(config)
        .then((res) => {
          // 如果我们为单个响应设置拦截器，这里使用单个响应的拦截器
          if (config.interceptors?.responseInterceptors)
            res = config.interceptors.responseInterceptors(res)
          resolve(res)
        })
        .catch((err: any) => {
          reject(err)
        })
    })
  }

  //
  get<T = any>(config: RequestConfig<InstanceInterceptors<T>>) {
    return this.request({ method: 'GET', ...config })
  }

  post<T = any>(config: RequestConfig<InstanceInterceptors<T>>) {
    return this.request({ method: 'POST', ...config })
  }
}

export default new Request({
  baseURL: 'http://localhost:30003/crf-service/',
  timeout: 1000 * 60 * 5,
  interceptors: {
    requestInterceptors: config => config,
    responseInterceptors: result => result,
  },
})
