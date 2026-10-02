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
	<section class="auth-card">
		<h1>Iniciar sesión</h1>

		<form class="auth-form" @submit.prevent="enviar">
			<input v-model="email" type="email" placeholder="Correo" required />
			<input v-model="password" type="password" placeholder="Contraseña" required />
			<button :disabled="loading">{{ loading ? 'Entrando...' : 'Entrar' }}</button>
		</form>

		<p v-if="error" role="alert">{{ error }}</p>
		<p>¿No tienes cuenta? <a href="/auth/registro">Regístrate</a></p>
	</section>
</template>

<style scoped>
/* Layout only: narrow centered card with vertical rhythm. */
.auth-card {
	max-width: 420px;
	width: 100%;
	margin-inline: auto;
	display: flex;
	flex-direction: column;
	gap: 1rem;
}
.auth-form {
	display: flex;
	flex-direction: column;
	gap: 0.9rem;
}
.auth-form input,
.auth-form button {
	width: 100%;
	padding: 0.65rem 0.8rem;
}
</style>
