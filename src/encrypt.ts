import MD5 from 'crypto-js/md5'

const SALT = "genshin"

const encrypt = (token: string | number) => MD5(SALT + token).toString()

export default encrypt
