#!/usr/bin/env node

const ALGORITHM = 'aes-256-ctr'
const ROOT = process.cwd()
const TMP = `${__dirname}/tmp`

const fs = require('fs')
const crypto = require('crypto')

const program = require('commander')
const prompt = require('prompt')

program
    .version('1.0.0')
    .option('-e, --encrypt', 'Encrypt file/dir. Default to decrypt.')
    .option('-p, --path [path]', 'Path file/dir to en/decrypt.')
    .option('-k, --keep', 'Keep file en/decrypt')
    .parse(process.argv)

program.encrypt = !!program.encrypt

prompt.start()

prompt.message = 'CRYPTO-CLI'
prompt.delimiter = ' > '

let App = {
    beforeCrypto: function(){
        prompt.get([{
            name: 'password',
            hidden: true,
            replace: '*'
        }], (err, rel) => {
            let password = rel.password

            prompt.get([{
                name: 'repassword',
                hidden: true,
                replace: '*'
            }], (err, rel) => {
                let repassword = rel.repassword

                if (password !== repassword){
                    console.log('Re-password is not match!')
                    return
                }

                this.queue = []
                this.queue.push(this.path)
                this.password = password

                this.startCrypto()
            })
        })
    },
    startCrypto: function(){
        let path = this.queue.shift()

        if (!path){
            console.log(`Finish ${this.method}!`)
            return
        }

        console.log(`[${this.method.toUpperCase()}] ${path}`)

        let info = fs.statSync(path)
        if (info.isFile()){
            let rs = fs.createReadStream(path)
            let ws = fs.createWriteStream(TMP)
            let cr = this.method === 'encrypt' ? crypto.createCipher(ALGORITHM, this.password) : crypto.createDecipher(ALGORITHM, this.password)

            ws.on('finish', () => {
                fs.unlinkSync(path)
                fs.renameSync(TMP, path)
                this.startCrypto()
            })

            rs.pipe(cr).pipe(ws)
        } else {
            let ls = fs.readdirSync(path)
            for (let i = 0; i < ls.length; i++){
                this.queue.push(`${path}/${ls[i]}`)
            }
            this.startCrypto()
        }
    },
    checkPath: function(){
        let path = `${ROOT}/${program.path}`
        this.path = fs.existsSync(program.path) ? program.path : fs.existsSync(path) ? path : false
        if (!this.path)
            return false

        return true
    },
    start: function(){
        if (!this.checkPath()){
            console.log(`${program.path} doesn't exist!`)
            return
        }

        if (program.encrypt)
            this.method = 'encrypt'
        else
            this.method = 'decrypt'

        this.beforeCrypto()
    }
}

App.start()
