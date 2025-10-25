import { httpBatchLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import superjson from 'superjson'

import type { AppRouter } from '../server/routers/_app'

function getBaseUrl() {
  if (typeof window !== 'undefined')
    // browser should use relative path
    return ''

  if (process.env.VERCEL_URL)
    // reference for vercel.com
    return `https://${process.env.VERCEL_URL}`

  if (process.env.RENDER_INTERNAL_HOSTNAME)
    // reference for render.com
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`

  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export const trpc = createTRPCNext<AppRouter>({
  config(opts) {
    return {
      transformer: superjson,
      links: [
        httpBatchLink({
          /**
           * If you want to use SSR, you need to use the server's full URL
           * @link https://trpc.io/docs/ssr
           **/
          url: `${getBaseUrl()}/api/trpc`,

          // You can pass any HTTP headers you wish here
          async headers() {
            return {
              // authorization: getAuthCookie(),
            }
          },
        }),
      ],

      /*

      
        ●クライアントサイドでデータ取得を行う際のデフォルトオプションを設定
        staleTime: Infinity:

        staleTimeは、キャッシュされたデータがどれくらいの期間「古くても許容されるか」を制御します。
        ここでは、Infinityが設定されており、キャッシュが常に最新の状態でなければならないことを意味します。
        つまり、一度取得したデータがキャッシュに保存されていても、クエリが実行されるたびに常に最新のデータを取得するようになります。



        retry: false:

        retryは、データの取得が失敗した場合に自動的に再試行するかどうかを制御します。
        ここでは、falseが設定されており、データ取得が失敗した場合には自動的に再試行しないようになります。



        refetchOnWindowFocus: false:

        refetchOnWindowFocusは、ウィンドウがフォーカスされた際に自動的にデータを再取得するかどうかを制御します。
        ここでは、falseが設定されており、ウィンドウのフォーカスが変更されたときに自動的にデータを再取得しないようになります。



        refetchOnReconnect: false:

        refetchOnReconnectは、ネットワークが再接続された際に自動的にデータを再取得するかどうかを制御します。
        ここでは、falseが設定されており、ネットワークの再接続が発生したときに自動的にデータを再取得しないようになります。



        refetchOnMount: false:

        refetchOnMountは、コンポーネントがマウント（表示される）された際に自動的にデータを再取得するかどうかを制御します。
        ここでは、falseが設定されており、コンポーネントがマウントされたときに自動的にデータを再取得しないようになります。



        suspense: false:

        suspenseは、ReactのSuspenseモードを使用してデータの非同期取得を行うかどうかを制御します。
        ここでは、falseが設定されており、Suspenseモードを使用せず、通常の非同期データ取得のフローを使用するようになります。

        
      */
      queryClientConfig: {
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
            suspense: false,
          },
        },
      },
    }
  },
  /**
   * @link https://trpc.io/docs/ssr
   **/
  ssr: false,
})
