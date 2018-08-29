// @flow
/* global RequestInfo, Response */
import EventEmitter from 'events'
import { authnFetch } from './authn-fetch'
import { openIdpSelector, startPopupServer } from './popup'
import type { Session } from './session'
import { getSession, saveSession, clearSession } from './session'
import type { AsyncStorage } from './storage'
import { defaultStorage } from './storage'
import { currentUrlNoParams } from './url-util'
import * as WebIdOidc from './webid-oidc'

export type loginOptions = {
  callbackUri: string,
  popupUri: string,
  storage: AsyncStorage
}

const defaultLoginOptions = (url: ?string): loginOptions => {
  return {
    callbackUri: url ? url.split('#')[0] : '',
    popupUri: '',
    storage: defaultStorage()
  }
}

export default class SolidAuthClient extends EventEmitter {
  fetch(input: RequestInfo, options?: Object): Promise<Response> {
    return authnFetch(defaultStorage())(input, options)
  }

  async login(idp: string, options: loginOptions): Promise<?Session> {
    options = { ...defaultLoginOptions(currentUrlNoParams()), ...options }
    const webIdOidcLogin = await WebIdOidc.login(idp, options)
    return webIdOidcLogin
  }

  async popupLogin(options: loginOptions): Promise<?Session> {
    options = { ...defaultLoginOptions(), ...options }
    if (!/https?:/.test(options.popupUri)) {
      options.popupUri = new URL(
        options.popupUri || '/.well-known/solid/login',
        window.location
      ).toString()
    }
    if (!options.callbackUri) {
      options.callbackUri = options.popupUri
    }
    const childWindow = openIdpSelector(options)
    const session = await startPopupServer(
      options.storage,
      childWindow,
      options
    )
    this.emit('login', session)
    this.emit('session', session)
    return session
  }

  async currentSession(
    storage: AsyncStorage = defaultStorage()
  ): Promise<?Session> {
    let session = await getSession(storage)
    if (!session) {
      try {
        session = await WebIdOidc.currentSession(storage)
      } catch (err) {
        console.error(err)
      }
      if (session) {
        this.emit('login', session)
        this.emit('session', session)
        await saveSession(storage)(session)
      }
    }
    return session
  }

  async trackSession(callback: Function): Promise<void> {
    /* eslint-disable standard/no-callback-literal */
    callback(await this.currentSession())
    this.on('session', callback)
  }

  async logout(storage: AsyncStorage = defaultStorage()): Promise<void> {
    const session = await getSession(storage)
    if (session) {
      try {
        await WebIdOidc.logout(storage)
        this.emit('logout')
        this.emit('session', null)
      } catch (err) {
        console.warn('Error logging out:')
        console.error(err)
      }
      await clearSession(storage)
    }
  }
}
