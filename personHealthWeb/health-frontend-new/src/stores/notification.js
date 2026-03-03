import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref([])
    let nextId = 1

    const add = (message, type = 'success', duration = 3000) => {
        const id = nextId++
        notifications.value.push({
            id,
            message,
            type,
            duration
        })

        if (duration > 0) {
            setTimeout(() => {
                remove(id)
            }, duration)
        }
        return id
    }

    const remove = (id) => {
        const index = notifications.value.findIndex(n => n.id === id)
        if (index !== -1) {
            notifications.value.splice(index, 1)
        }
    }

    return {
        notifications,
        add,
        remove
    }
})
