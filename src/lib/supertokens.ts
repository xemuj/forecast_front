import SuperTokens from 'supertokens-web-js'
import Session from 'supertokens-web-js/recipe/session'
import EmailPassword from 'supertokens-web-js/recipe/emailpassword'

SuperTokens.init({
  appInfo: {
    appName: 'Weather App',
    apiDomain: 'http://localhost:8000',
    apiBasePath: '/auth',
  },
  recipeList: [
    EmailPassword.init(),
    Session.init(),
  ],
})