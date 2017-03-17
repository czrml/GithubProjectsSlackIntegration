const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const moment = require('moment')
const port = process.env.PORT || 80
const IncomingWebhook = require('@slack/client').IncomingWebhook
const url = process.env.SLACK_WEBHOOK_URL || ''
const webhook = new IncomingWebhook(url)
const smb = require('slack-message-builder')

app.use(bodyParser.json())

app.post('*', (req, res) => {
  let data = req.body
  console.log(data.project_column)
  let message

  if (data.project !== undefined) {
    data.item = {
      name: data.project.name,
      html_url: data.project.html_url
    }
    message = makeResponse(data, 'project')
  }
  if (data.project_column !== undefined) {
    data.item = {
      name: data.project_column.name,
      html_url: data.project_column.html_url
    }
    message = makeResponse(data, 'column')
  }
  if (data.project_card !== undefined) {
    data.item = {
      name: data.project_card.note || `issue #${data.project_card.content_url.split('/').pop()}`,
      html_url: data.project_card.html_url
    }
    message = makeResponse(data, 'card')
  }

  webhook.send(message, function (err, res) {
    if (err) {
      console.log('Error:', err)
    }
  })
  return
})

function makeResponse (data, type) {
  return smb()
    .attachment()
      .fallback(`@${data.sender.login} ${data.action} ${data.item.name} on ${data.repository.full_name}`)
      .color(getColor(data.action))
      .authorName(`@${data.sender.login}`)
      .authorLink(data.sender.html_url)
      .authorIcon(data.sender.avatar_url)
      .field()
        .title(`${data.action.charAt(0).toUpperCase() + data.action.slice(1)} ${type}`)
        .value(data.item.html_url ? `<${data.item.html_url}|${data.item.name}>` : data.item.name)
        .short(true)
      .end()
      .field()
        .title(`Repository`)
        .value(`<${data.repository.html_url}|${data.repository.name}>`)
        .short(true)
      .end()
      .footer('Github Projects')
      .footerIcon('https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png')
      .ts(moment().unix())
    .end()
    .json()
}

function getColor (status) {
  switch (status.toLowerCase()) {
    case 'created':
      return '#40c057'
    case 'deleted':
      return '#fa5252'
    case 'moved':
      return '#fab005'
    case 'converted':
      return '#7950f2'
    case 'closed':
      return '#82c91e'
    case 'reopened':
      return '#fd7e14'
    case 'edited':
      return '#e64980'
    default:
      return '#228ae6'
  }
}

app.listen(port)
console.log(`Server v listening on port ${port}`)
