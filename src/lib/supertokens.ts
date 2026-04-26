import SuperTokens from 'supertokens-web-js'
import Session from 'supertokens-web-js/recipe/session'
import EmailPassword from 'supertokens-web-js/recipe/emailpassword'

SuperTokens.init({
  appInfo: {
    appName: 'Weather App',
    apiDomain: import.meta.env.VITE_API_URL as string,
    apiBasePath: '/auth',
  },
  recipeList: [
    EmailPassword.init(),
    Session.init(),
  ],
})