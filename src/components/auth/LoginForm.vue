<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../../composables/useAuth'

const { loading, error, signIn } = useAuth()

const email = ref('')
const password = ref('')

function enviar() {
	signIn(email.value, password.value)
}
</script>

<template>
	<h1>Iniciar sesión</h1>

	<form @submit.prevent="enviar">
		<input v-model="email" type="email" placeholder="Correo" required />
		<input v-model="password" type="password" placeholder="Contraseña" required />
		<button :disabled="loading">{{ loading ? 'Entrando...' : 'Entrar' }}</button>
	</form>

	<p v-if="error" role="alert">{{ error }}</p>
	<p>¿No tienes cuenta? <a href="/auth/registro">Regístrate</a></p>
</template>
