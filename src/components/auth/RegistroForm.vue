<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../../composables/useAuth'

const { loading, error, message, signUp } = useAuth()

const nombre = ref('')
const email = ref('')
const password = ref('')

function enviar() {
	signUp(email.value, password.value, nombre.value)
}
</script>

<template>
	<h1>Crear cuenta</h1>

	<form @submit.prevent="enviar">
		<input v-model="nombre" type="text" placeholder="Nombre completo" required />
		<input v-model="email" type="email" placeholder="Correo" required />
		<input v-model="password" type="password" placeholder="Contraseña (mín. 6)" minlength="6" required />
		<button :disabled="loading">{{ loading ? 'Creando...' : 'Registrarme' }}</button>
	</form>

	<p v-if="error" role="alert">{{ error }}</p>
	<p v-if="message">{{ message }}</p>
	<p>¿Ya tienes cuenta? <a href="/auth/login">Inicia sesión</a></p>
</template>
