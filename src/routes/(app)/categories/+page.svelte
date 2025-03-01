<script lang="ts">
    import { Button } from '$lib/components/ui/button'
    import * as Card from '$lib/components/ui/card'
    import { Input } from '$lib/components/ui/input'
    import { Label } from '$lib/components/ui/label'
    import * as Dialog from '$lib/components/ui/dialog'
    import { categories, store } from '$lib/db/store'
    import { getCategoryIcon, getCategoryColor, getCategoryEmoji } from '$lib/components/common'
    import { Check, Edit, Plus, Trash2, X } from 'lucide-svelte'
    import { onMount } from 'svelte'
    import type { CategoryItem } from '$lib/db'
    import { toast } from 'svelte-sonner'

    let isAddDialogOpen = false
    let isEditDialogOpen = false
    let isDeleteDialogOpen = false
    let isLoading = true

    // New category form
    let newCategoryName = ''
    let newCategoryValue = ''
    let newCategoryIcon = ''
    let newCategoryColor = ''
    let newCategoryEmoji = ''

    // Edit category form
    let editCategoryId: IDBValidKey | null = null
    let editCategoryName = ''
    let editCategoryValue = ''
    let editCategoryIcon = ''
    let editCategoryColor = ''
    let editCategoryEmoji = ''
    let editCategoryIsEnabled = true
    let editCategoryIsDefault = false

    // Delete category
    let deleteCategoryId: IDBValidKey | null = null
    let deleteCategoryName = ''

    onMount(async () => {
        try {
            await store.getAllCategories()
            isLoading = false
        } catch (error) {
            console.error('Error loading categories:', error)
            toast.error('Failed to load categories')
            isLoading = false
        }
    })

    function resetNewCategoryForm() {
        newCategoryName = ''
        newCategoryValue = ''
        newCategoryIcon = ''
        newCategoryColor = ''
        newCategoryEmoji = ''
    }

    function resetEditCategoryForm() {
        editCategoryId = null
        editCategoryName = ''
        editCategoryValue = ''
        editCategoryIcon = ''
        editCategoryColor = ''
        editCategoryEmoji = ''
        editCategoryIsEnabled = true
        editCategoryIsDefault = false
    }

    function resetDeleteCategoryForm() {
        deleteCategoryId = null
        deleteCategoryName = ''
    }

    function handleAddClick() {
        resetNewCategoryForm()
        isAddDialogOpen = true
    }

    function handleEditClick(category: CategoryItem) {
        editCategoryId = category.id || null
        editCategoryName = category.name
        editCategoryValue = category.value
        editCategoryIcon = category.icon
        editCategoryColor = category.color
        editCategoryEmoji = category.emoji
        editCategoryIsEnabled = category.isEnabled
        editCategoryIsDefault = category.isDefault
        isEditDialogOpen = true
    }

    function handleDeleteClick(category: CategoryItem) {
        deleteCategoryId = category.id || null
        deleteCategoryName = category.name
        isDeleteDialogOpen = true
    }

    function generateValueFromName(name: string): string {
        return name.toLowerCase().replace(/\s+/g, '_')
    }

    async function handleAddCategory() {
        if (!newCategoryName) {
            toast.error('Category name is required')
            return
        }

        const value = newCategoryValue || generateValueFromName(newCategoryName)
        
        try {
            await store.addCategory({
                name: newCategoryName,
                value,
                icon: newCategoryIcon || value,
                color: newCategoryColor || value,
                emoji: newCategoryEmoji || value,
                isDefault: false,
                isEnabled: true
            })
            
            isAddDialogOpen = false
            resetNewCategoryForm()
            toast.success('Category added successfully')
        } catch (error) {
            console.error('Error adding category:', error)
            toast.error('Failed to add category')
        }
    }

    async function handleUpdateCategory() {
        if (!editCategoryId) return
        
        if (!editCategoryName) {
            toast.error('Category name is required')
            return
        }

        try {
            await store.updateCategory(editCategoryId, {
                name: editCategoryName,
                value: editCategoryValue,
                icon: editCategoryIcon,
                color: editCategoryColor,
                emoji: editCategoryEmoji,
                isEnabled: editCategoryIsEnabled,
                isDefault: editCategoryIsDefault
            })
            
            isEditDialogOpen = false
            resetEditCategoryForm()
            toast.success('Category updated successfully')
        } catch (error) {
            console.error('Error updating category:', error)
            toast.error('Failed to update category')
        }
    }

    async function handleDeleteCategory() {
        if (!deleteCategoryId) return
        
        try {
            await store.deleteCategory(deleteCategoryId)
            
            isDeleteDialogOpen = false
            resetDeleteCategoryForm()
            toast.success('Category deleted successfully')
        } catch (error) {
            console.error('Error deleting category:', error)
            toast.error('Failed to delete category')
        }
    }

    async function toggleCategoryStatus(category: CategoryItem) {
        try {
            await store.updateCategory(category.id!, {
                isEnabled: !category.isEnabled
            })
            toast.success(`Category ${category.isEnabled ? 'disabled' : 'enabled'} successfully`)
        } catch (error) {
            console.error('Error toggling category status:', error)
            toast.error('Failed to update category')
        }
    }

    $: sortedCategories = [...$categories].sort((a, b) => {
        // Sort by default categories first, then by enabled status, then by name
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
        if (a.isEnabled !== b.isEnabled) return a.isEnabled ? -1 : 1
        return a.name.localeCompare(b.name)
    })
</script>

<div class="flex items-center font-bold text-3xl bg-gray-50 sticky top-0 z-50 py-2 mt-10 md:mt-5 w-full">
    <div class="flex-1">Categories</div>
    <Button on:click={handleAddClick} class="ml-auto flex justify-center items-center">
        <Plus size={24} />
        Add
    </Button>
</div>

<div class="mt-4">
    <p class="text-muted-foreground mb-4">
        Manage your expense categories. You can add, edit, or disable categories to better organize your transactions.
    </p>

    {#if isLoading}
        <div class="flex justify-center items-center h-40">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    {:else if sortedCategories.length === 0}
        <Card.Root class="p-6 flex flex-col items-center justify-center h-40">
            <p class="text-muted-foreground mb-4">No categories found</p>
            <Button on:click={handleAddClick}>Add Category</Button>
        </Card.Root>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each sortedCategories as category (category.id)}
                <Card.Root class="overflow-hidden">
                    <div class="p-4 flex items-center gap-3">
                        <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" 
                             style="background-color: {getCategoryColor(category.value)}">
                            <svelte:component this={getCategoryIcon(category.value)} size={20} />
                        </div>
                        <div class="flex-1 min-w-0">
                            <Card.Title class="truncate">{category.name}</Card.Title>
                            <Card.Description class="truncate">
                                {category.isDefault ? 'Default category' : 'Custom category'}
                                {#if !category.isEnabled}
                                    <span class="text-red-500"> (Disabled)</span>
                                {/if}
                            </Card.Description>
                        </div>
                        <div class="flex gap-1">
                            <Button variant="ghost" size="icon" on:click={() => toggleCategoryStatus(category)}
                                    title={category.isEnabled ? 'Disable category' : 'Enable category'}>
                                {#if category.isEnabled}
                                    <X size={18} />
                                {:else}
                                    <Check size={18} />
                                {/if}
                            </Button>
                            <Button variant="ghost" size="icon" on:click={() => handleEditClick(category)}
                                    title="Edit category">
                                <Edit size={18} />
                            </Button>
                            {#if !category.isDefault}
                                <Button variant="ghost" size="icon" on:click={() => handleDeleteClick(category)}
                                        title="Delete category">
                                    <Trash2 size={18} />
                                </Button>
                            {/if}
                        </div>
                    </div>
                </Card.Root>
            {/each}
        </div>
    {/if}
</div>

<!-- Add Category Dialog -->
<Dialog.Root bind:open={isAddDialogOpen}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Add Category</Dialog.Title>
            <Dialog.Description>
                Create a new expense category to organize your transactions.
            </Dialog.Description>
        </Dialog.Header>
        
        <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="name" class="text-right">Name</Label>
                <Input id="name" bind:value={newCategoryName} class="col-span-3" 
                       placeholder="e.g. Groceries" required />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="value" class="text-right">Value</Label>
                <Input id="value" bind:value={newCategoryValue} class="col-span-3" 
                       placeholder="e.g. groceries (auto-generated if empty)" />
                <div class="col-span-4 text-xs text-muted-foreground text-right">
                    Used as identifier. Will be auto-generated from name if left empty.
                </div>
            </div>
        </div>
        
        <Dialog.Footer>
            <Button variant="outline" on:click={() => isAddDialogOpen = false}>Cancel</Button>
            <Button on:click={handleAddCategory}>Add Category</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<!-- Edit Category Dialog -->
<Dialog.Root bind:open={isEditDialogOpen}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Edit Category</Dialog.Title>
            <Dialog.Description>
                Update the category details.
            </Dialog.Description>
        </Dialog.Header>
        
        <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="edit-name" class="text-right">Name</Label>
                <Input id="edit-name" bind:value={editCategoryName} class="col-span-3" 
                       placeholder="e.g. Groceries" required />
            </div>
            {#if editCategoryIsDefault}
                <div class="text-amber-600 text-sm">
                    This is a default category. Some fields cannot be modified.
                </div>
            {/if}
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="edit-enabled" class="text-right">Status</Label>
                <div class="col-span-3 flex items-center gap-2">
                    <input type="checkbox" id="edit-enabled" bind:checked={editCategoryIsEnabled} />
                    <Label for="edit-enabled">Enabled</Label>
                </div>
            </div>
        </div>
        
        <Dialog.Footer>
            <Button variant="outline" on:click={() => isEditDialogOpen = false}>Cancel</Button>
            <Button on:click={handleUpdateCategory}>Update Category</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<!-- Delete Category Dialog -->
<Dialog.Root bind:open={isDeleteDialogOpen}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Delete Category</Dialog.Title>
            <Dialog.Description>
                Are you sure you want to delete the category "{deleteCategoryName}"?
                This action cannot be undone.
            </Dialog.Description>
        </Dialog.Header>
        
        <Dialog.Footer>
            <Button variant="outline" on:click={() => isDeleteDialogOpen = false}>Cancel</Button>
            <Button variant="destructive" on:click={handleDeleteCategory}>Delete</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>