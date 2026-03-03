//定义store
import {defineStore} from "pinia";
import {ref} from "vue";

export const useTokenStore = defineStore('token',()=>{

    const token = ref('');
    const role = ref('');

    const setToken=(newToken)=>{
        token.value=newToken
    }
    const setRole=(newRole)=>{
        role.value=newRole
    }

    const removeToken = ()=>{
        token.value=('')
    }
    const removeRole = ()=>{
        role.value=('')
    }
    return {
        token,setToken,removeToken,
        role,setRole,removeRole
    }
},{
    persist:true
});
