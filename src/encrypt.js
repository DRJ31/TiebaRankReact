import MD5 from 'crypto-js/md5'

const SALT = "genshin"

const encrypt = token => MD5(SALT + token).toString()

export default encrypt